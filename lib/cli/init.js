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

/* eslint-disable global-require */

var fs = require("fs")
var path = require("path")
var globParent = require("./glob-parent")
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

function findOpts(args, util, error, next) {
    /**
     * Lots of duplication here with `findConfig` from `./loader`, but I
     * can't really avoid it, since I don't have the full state loaded yet.
     */

    var missing = Object.create(null)

    function search(dir, error, next) {
        while (missing[dir]) {
            var dirname = path.dirname(dir)

            if (dirname === dir) return next()
            dir = dirname
        }

        util.read(path.join(dir, ".tl.opts")).then(
            function (contents) {
                return next(util.resolve(dir), contents)
            },
            function (err) {
                if (err.code === "ENOENT" ||
                        err.code === "ENOTDIR" ||
                        err.code === "EISDIR") {
                    missing[dir] = true
                    return search(dir, error, next)
                } else {
                    return error(err)
                }
            })
        return undefined
    }

    var files = args.files.length ? args.files : ["test/**"]

    function loop(index, error, next) {
        var dir = globParent(util.resolve(files[index]))

        return search(dir, error, function (file, contents) {
            if (file != null || index + 1 === files.length) {
                return next(file, contents)
            } else {
                return loop(index + 1, error, next)
            }
        })
    }

    return loop(0, error, next)
}

function readOpts(args, util, error, next) {
    if (args.opts != null) {
        var file = util.resolve(args.opts)

        util.read(file, "utf-8").then(function (contents) {
            return next(path.dirname(file), contents)
        }, error)
    } else {
        findOpts(args, util, error, next)
    }
}

function appendResolved(list, extra, dirname) {
    for (var i = 0; i < extra.length; i++) {
        list.unshift(path.resolve(dirname, extra[i]))
    }
}

function loadOpts(args, util, error, next) {
    readOpts(args, util, error, function (dirname, contents) {
        if (dirname == null) return process.nextTick(next)
        var extra

        try {
            extra = parse(splitOpts(contents))
        } catch (e) {
            return process.nextTick(error, e)
        }

        // Note: this list must be kept up with `Args` in `./parse`, or
        // things will likely break
        if (extra.color != null && args.color == null) {
            args.color = extra.color
        }

        if (extra.config != null && args.config == null) {
            args.config = path.resolve(dirname, extra.config)
        }

        if (extra.cwd != null && args.cwd == null) {
            args.cwd = path.resolve(dirname, extra.cwd)
        }

        appendResolved(args.require, extra.require, dirname)
        appendResolved(args.unknown, extra.unknown, dirname)
        return process.nextTick(next)
    })
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

function reallyRespawn(flags, error, next) {
    function finish(code) {
        if (code != null) return next(code)
        return undefined
    }

    require("child_process").spawn(process.argv[0], flags, {stdio: "inherit"})
    .on("exit", finish)
    .on("close", finish)
    .on("error", error)
}

function respawn(args, filename, error, next) {
    var flags = args.unknown.concat([filename])

    if (args.color != null) flags.push(args.color ? "--color" : "--no-color")
    if (args.config != null) flags.push("--config", args.config)
    if (args.cwd != null) flags.push("--cwd", args.cwd)

    for (var i = 0; i < args.require.length; i++) {
        flags.push("--require", args.require[i])
    }

    // It shouldn't respawn again in the child process, but I added the flag
    // here just in case. Also, don't try to specially resolve anything in the
    // respawned local CLI.
    flags.push("--no-respawn", "--force-local", "--")
    flags.push.apply(flags, args.files)

    // If only I could literally substitute the process...
    return reallyRespawn(flags, error, next)
}

module.exports = function (filename, args, error, next) {
    // If help is requested, print it now.
    if (args.help) {
        var file = path.resolve(__dirname, "help-" + args.help + ".txt")

        fs.readFile(file, "utf-8", function (err, contents) {
            if (err != null) {
                return error(err)
            }

            // Pad the top by a line.
            console.log()
            console.log(process.platform === "win32"
                ? contents.replace("\n", "\r\n")
                : contents)

            return next(0)
        })
    } else {
        var Util = require("./util")

        loadOpts(args, Util, error, function () {
            if (args.respawn && args.unknown.length !== 0) {
                respawn(args, filename, error, next)
            } else {
                // Uncomment to log all FS calls.
                // require("../scripts/log-fs")
                require("./run").run(args, Util).then(next, error)
            }
        })
    }
}
