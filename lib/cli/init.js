"use strict"

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

var fs = require("fs")
var path = require("path")
var Common = require("./init-common")
var parse = require("./parse")

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

function readOpts(args) {
    /**
     * Lots of duplication here with `findConfig` from `./loader`, but I
     * can't really avoid it, since I don't have the full state loaded yet.
     */
    var missing = Object.create(null)
    var files = args.files.length ? args.files : ["test/**"]

    function search(dir) {
        for (;;) {
            while (missing[dir]) {
                var dirname = path.dirname(dir)

                if (dirname === dir) return undefined
                dir = dirname
            }

            try {
                return {
                    dirname: path.resolve(dir),
                    contents: fs.readFileSync(
                        path.join(dir, ".tl.opts"),
                        "utf-8"),
                }
            } catch (e) {
                if (!/^(ENOENT|ENOTDIR|EISDIR)$/.test(e.code)) throw e
            }

            missing[dir] = true
        }
    }

    if (args.opts != null) {
        var file = path.resolve(args.opts)

        return {
            dirname: path.dirname(file),
            contents: fs.readFileSync(file, "utf-8"),
        }
    } else {
        for (var i = 0; i < files.length; i++) {
            var result = search(Common.globParent(files[i]))

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
    var filename = path.resolve(__dirname, "../../bin/tl.js")
    var flags = args.unknown.concat([filename])

    if (args.color != null) flags.push(args.color ? "--color" : "--no-color")
    if (args.config != null) flags.push("--config", args.config)
    if (args.cwd != null) flags.push("--cwd", args.cwd)

    args.require.forEach(function (file) {
        flags.push("--require", file)
    })

    // It shouldn't respawn again in the child process, but I added the flag
    // here just in case. Also, don't try to specially resolve anything in the
    // respawned local CLI.
    flags.push("--no-respawn", "--force-local", "--")
    flags.push.apply(flags, args.files)

    // If only there was a cross-platform way to replace the current process
    // like in Ruby...
    require("child_process").spawn(process.argv[0], flags, {stdio: "inherit"})
    .on("exit", function (code) { if (code != null) process.exit(code) })
    .on("close", function (code) { if (code != null) process.exit(code) })
    .on("error", function (e) {
        console.error(e.stack)
        process.exit(1)
    })
}

function execute(args) {
    // Uncomment to log all FS calls.
    // require("../../scripts/log-fs")
    require("./run").run(args, require("./util"))
    .then(process.exit, function (e) {
        if (e instanceof Common.Warning) {
            console.error(e.message)
        } else {
            // Not all libraries provide a nice stack trace.
            console.error(e.stack || e.message)
        }
        process.exit(1)
    })
}

module.exports = function (args) {
    // If help is requested, print it now.
    if (args.help) {
        var file = path.resolve(__dirname, "help-" + args.help + ".txt")
        var contents = fs.readFileSync(file, "utf-8")

        // Pad the top by a line.
        console.log()
        console.log(process.platform === "win32"
            ? contents.replace("\n", "\r\n")
            : contents)

        process.exit()
    } else {
        var data = readOpts(args)

        if (data != null) {
            var extra = parse(splitOpts(data.contents))

            // Note: this list must be kept up with `Args` in `./parse`, or
            // things will likely break
            if (extra.color != null && args.color == null) {
                args.color = extra.color
            }

            if (extra.config != null && args.config == null) {
                args.config = path.resolve(data.dirname, extra.config)
            }

            if (extra.cwd != null && args.cwd == null) {
                args.cwd = path.resolve(data.dirname, extra.cwd)
            }

            extra.require.forEach(function (file) {
                args.require.unshift(path.resolve(data.dirname, file))
            })

            extra.unknown.forEach(function (file) {
                args.unknown.unshift(path.resolve(data.dirname, file))
            })
        }

        if (args.respawn && args.unknown.length) {
            respawn(args)
        } else {
            process.nextTick(execute, args)
        }
    }
}
