"use strict"

/* eslint-env commonjs */

/**
 * Do watch the dependency chain here - this is called even before the process
 * is respawned, and it should load as little as practically possible before
 * respawning.
 *
 * For similar reasons, this lazily loads as many of its dependencies as it
 * possibly can, which is also why the `global-require` rule is disabled. It
 * also avoids Promises to speed things up, and tries to read the files first
 * without `stat`ing them (it's faster to ask for forgiveness than permission in
 * this case). All this work to ensure this works as quickly as possible.
 */

/* eslint-disable global-require, no-process-exit */

var path = require("path")
var Util = require("./lib/cli/util.js")
var Args = require("./lib/cli/args")
var hasOwn = Object.prototype.hasOwnProperty

// NOTE: All updates to this method *must* be mirrored to the identically named
// function in `./common.js`
function globParent(str) {
    // preserves full path in case of trailing path separator
    str = path.normalize(path.join(str, "a"))

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}

// Easier to just write a mini parser than to try to do some RegExp magic.
function splitOpts(contents) {
    if (contents.length === 0) return []

    var args = []
    var last = contents[0]
    var acc = /\s/.test(last) ? "" : last
    var pushed = false
    var escape = false

    for (var i = 1; i < contents.length; i++) {
        var ch = contents[i]

        if (!escape && /\s/.test(ch)) {
            // So we're not pushing duplicates from multiple spaces
            if (!pushed) args.push(acc)
            pushed = true
            acc = ""
        } else {
            pushed = false
            escape = !escape && ch === "\\"
            if (!escape) {
                acc += ch
                last = ch
            }
        }
    }

    return args
}

function search(missing, dir) {
    for (;;) {
        while (missing[dir]) {
            var dirname = path.dirname(dir)

            if (dirname === dir) return undefined
            dir = dirname
        }

        try {
            return {
                dirname: Util.resolve(dir),
                contents: Util.read(path.join(dir, ".tl.opts")),
            }
        } catch (e) {
            if (!/^(ENOENT|ENOTDIR|EISDIR)$/.test(e.code)) throw e
        }

        missing[dir] = true
    }
}

function readOpts(args) {
    /**
     * Lots of duplication here with `findConfig` from `./loader`, but I
     * can't really avoid it, since I don't have the full state loaded yet.
     */
    var missing = Object.create(null)
    var files = args.files.length ? args.files : ["test/**"]

    if (args.opts != null) {
        var file = Util.resolve(args.opts)

        return {
            dirname: path.dirname(file),
            contents: Util.read(file),
        }
    } else {
        for (var i = 0; i < files.length; i++) {
            var result = search(missing, globParent(files[i]))

            if (result != null) return result
        }

        return undefined
    }
}

// If we have unknown flags (and respawning isn't disabled), respawn Node with
// the unknown flags passed directly to it.
//
// The reason unknown flags (any that Thallium doesn't understand) are passed
// directly to it is because V8 changes its flags between even minor releases.
// Between that and the relative difficulty of figuring out what flags are
// actually supported by V8 (`v8flags`' module implementation is non-trivial),
// is why I just let Node figure out the rest. Worst case scenario, Node
// complains about a bad option and errors out.

function respawn(args) {
    var flags = []

    if (args.color != null) flags.push(args.color ? "--color" : "--no-color")
    if (args.config != null) flags.push("--config", args.config)
    if (args.cwd != null) flags.push("--cwd", args.cwd)

    args.require.forEach(function (file) {
        flags.push("--require", file)
    })

    // It shouldn't respawn again in the child process, but I added the flag
    // here just in case. Also, don't try to specially resolve anything in the
    // respawned local CLI.
    flags.push("--")
    flags.push.apply(flags, args.files)

    // If only there was a cross-platform way to replace the current process
    // like in Ruby...
    Util.respawn({
        program: args.respawnAs,
        nodeOptions: args.unknown,
        tlOptions: flags,
    })
}

function execute(args) {
    // Uncomment to log all FS calls.
    // require("./scripts/log-fs")
    require("./lib/cli/run").run(args, require("./lib/cli/util"))
    .then(Util.exit, function (e) {
        // Not all libraries provide a nice stack trace, and our warning error
        // is just a message.
        Util.printError(e.stack || e.message)
        Util.exit(1)
    })
}

function setEnv(object) {
    for (var key in object) {
        if (hasOwn.call(object, key)) Util.setEnv(key, object[key])
    }
}

function forceRespawn(args) {
    if (args.respawnAs != null) return true
    if (args.env != null) return true
    if (args.unknown.length) return true
    return false
}

function parseArgs(args) {
    try {
        return Args.parse(args)
    } catch (e) {
        if (typeof e !== "string") throw e
        Util.printError(e)
        return Util.exit(1)
    }
}

module.exports = function (argv) {
    var args = parseArgs(argv)

    // If help is requested, print it now.
    if (args.help) {
        Util.printHelp(args.help)
        Util.exit()
        return // unreachable
    }

    setEnv(args.env)

    var data = readOpts(args)

    if (data != null) {
        var extra = parseArgs(splitOpts(data.contents))

        // Note: this list must be kept up with `./args`, or things will
        // likely break
        if (extra.color != null && args.color == null) {
            args.color = extra.color
        }

        if (extra.config != null && args.config == null) {
            args.config = Util.resolve(data.dirname, extra.config)
        }

        if (extra.cwd != null && args.cwd == null) {
            args.cwd = Util.resolve(data.dirname, extra.cwd)
        }

        extra.require.forEach(function (file) {
            args.require.unshift(Util.resolve(data.dirname, file))
        })

        extra.unknown.forEach(function (file) {
            args.unknown.unshift(Util.resolve(data.dirname, file))
        })

        if (extra.respawnAs != null) args.respawnAs = extra.respawnAs
        setEnv(extra.env)
    }

    if (forceRespawn(args)) {
        respawn(args)
    } else {
        Promise.resolve(args).then(execute)
    }
}
