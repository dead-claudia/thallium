"use strict"

/* eslint-env node */

/**
 * Helper script for logging FS calls. It logs calls in the form of this:
 *
 * file descriptor:  [2016-01-01T01:23:45.678Z]: access fd 9 (12.345 µs)
 * file name/buffer: [2016-01-01T01:23:45.678Z]: access ./file.txt 9 (12.345 µs)
 */

var Module = require("module")
var fs = require("fs")
var showStack = false

function transfer(f, g, prop) {
    try {
        Object.defineProperty(g, prop,
            Object.getOwnPropertyDescriptor(f, prop))
    } catch (_) {
        // ignore
    }
}

function printEnd(str, hrtime) {
    if (!str) return

    var end = process.hrtime(hrtime)

    console.error("[" + new Date().toISOString() + "]: " + str +
        " (" + (end[0] * 1e6 + end[1] / 1e3) + " µs)")
}

function printStack(source) {
    if (!showStack) return
    var e = new Error()

    e.name = "Trace:"
    Error.captureStackTrace(e, source)
    console.error(e.stack)
}

function patch(host, method, inject, sync) {
    var old = host[method]

    if (typeof old !== "function") return

    var f

    if (sync === true) {
        f = host[method] = function () {
            var str = inject.apply(undefined, arguments)

            printStack(host[method])
            var hrtime = process.hrtime()

            try {
                return old.apply(this, arguments)
            } finally {
                printEnd(str, hrtime)
            }
        }
    } else if (sync === false) {
        f = host[method] = function () {
            var str = inject.apply(undefined, arguments)

            printStack(host[method])
            var hrtime = process.hrtime()
            var args = []

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (typeof args[args.length - 1] === "function") {
                var callback = args[args.length - 1]

                args[args.length - 1] = function () {
                    printEnd(str + hrtime)
                    return callback.apply(this, arguments)
                }
            }

            try {
                return old.apply(this, args)
            } catch (e) {
                printEnd(str + hrtime)
                throw e
            }
        }
    } else {
        f = host[method] = function () {
            var str = inject.apply(undefined, arguments)

            printStack(host[method])

            if (str) console.error(str)
            return old.apply(this, arguments)
        }
    }

    f.prototype = old.prototype

    transfer(old, f, "length")
    transfer(old, f, "name")
}

function logPath(name, file) {
    if (typeof file === "string") {
        return name + " " + file
    } else if (Buffer.isBuffer(file)) {
        return name + " " + file.toString("utf-8")
    } else {
        return ""
    }
}

function simple(name) {
    return function (file) {
        if (typeof file === "number") {
            return name + " fd " + file
        } else {
            return logPath(name, file)
        }
    }
}

function move(name) {
    return function (src, dest) {
        return logPath(name, src) + logPath("", dest)
    }
}

patch(fs, "access", simple("access"), false)
patch(fs, "accessSync", simple("access"), true)
patch(fs, "appendFile", simple("appendFile"), false)
patch(fs, "appendFileSync", simple("appendFile"), true)
patch(fs, "chmod", simple("chmod"), false)
patch(fs, "chmodSync", simple("chmod"), true)
patch(fs, "chown", simple("chown"), false)
patch(fs, "chownSync", simple("chown"), true)
patch(fs, "close", simple("close"), false)
patch(fs, "closeSync", simple("close"), true)
patch(fs, "createReadStream", simple("createReadStream"))
patch(fs, "createWriteStream", simple("createWriteStream"))
patch(fs, "exists", simple("exists"), false)
patch(fs, "existsSync", simple("exists"), true)
patch(fs, "fchmod", simple("fchmod"), false)
patch(fs, "fchmodSync", simple("fchmod"), true)
patch(fs, "fchown", simple("fchown"), false)
patch(fs, "fchownSync", simple("fchown"), true)
patch(fs, "fdatasync", simple("fdatasync"), false)
patch(fs, "fdatasyncSync", simple("fdatasync"), true)
patch(fs, "fstat", simple("fstat"), false)
patch(fs, "fstatSync", simple("fstat"), true)
patch(fs, "fsync", simple("fsync"), false)
patch(fs, "fsyncSync", simple("fsync"), true)
patch(fs, "ftruncate", simple("ftruncate"), false)
patch(fs, "ftruncateSync", simple("ftruncate"), true)
patch(fs, "futimes", simple("futimes"), false)
patch(fs, "futimesSync", simple("futimes"), true)
patch(fs, "lchmod", simple("lchmod"), false)
patch(fs, "lchmodSync", simple("lchmod"), true)
patch(fs, "lchown", simple("lchown"), false)
patch(fs, "lchownSync", simple("lchown"), true)
patch(fs, "link", move("link"), false)
patch(fs, "linkSync", move("link"), true)
patch(fs, "lstat", simple("lstat"), false)
patch(fs, "lstatSync", simple("lstat"), true)
patch(fs, "mkdir", simple("mkdir"), false)
patch(fs, "mkdirSync", simple("mkdir"), true)
patch(fs, "mkdtemp", simple("mkdtemp"), false)
patch(fs, "mkdtempSync", simple("mkdtemp"), true)
patch(fs, "open", simple("open"), false)
patch(fs, "openSync", simple("open"), true)
patch(fs, "read", function (fd) {
    return typeof fd === "number" ? "read fd " + fd : ""
}, false)
patch(fs, "readSync", function (fd) {
    return typeof fd === "number" ? "read fd " + fd : ""
}, true)
patch(fs, "readdir", simple("readdir"), false)
patch(fs, "readdirSync", simple("readdir"), true)
patch(fs, "readFile", simple("readFile"), false)
patch(fs, "readFileSync", simple("readFile"), true)
patch(fs, "readlink", simple("readlink"), false)
patch(fs, "readlinkSync", simple("readlink"), true)
patch(fs, "realpath", simple("realpath"), false)
patch(fs, "realpathSync", simple("realpath"), true)
patch(fs, "rename", move("rename"), false)
patch(fs, "renameSync", move("rename"), true)
patch(fs, "rmdir", simple("rmdir"), false)
patch(fs, "rmdirSync", simple("rmdir"), true)
patch(fs, "stat", simple("stat"), false)
patch(fs, "statSync", simple("stat"), true)
patch(fs, "symlink", simple("symlink"), false)
patch(fs, "symlinkSync", simple("symlink"), true)
patch(fs, "truncate", simple("truncate"), false)
patch(fs, "truncateSync", simple("truncate"), true)
patch(fs, "unlink", simple("unlink"), false)
patch(fs, "unlinkSync", simple("unlink"), true)
patch(fs, "unwatch", simple("unwatch"))
patch(fs, "unwatchFile", simple("unwatchFile"))
patch(fs, "utimes", simple("utimes"), false)
patch(fs, "utimesSync", simple("utimes"), true)
patch(fs, "watch", simple("watch"))
patch(fs, "watchFile", simple("watchFile"))
patch(fs, "ReadStream", simple("createReadStream"))
patch(fs, "WriteStream", simple("createReadStream"))

console.error("Tracing FS calls...")

if (require.main === module) {
    var moduleName = require.resolve((function () {
        switch (process.argv[2]) {
        case "tl": return require.resolve("../bin/_tl.js")
        case "mocha": return require.resolve("mocha/bin/mocha")
        case undefined:
            console.error("Binary name required")
            return process.exit(1) // eslint-disable-line no-process-exit
        default:
            console.error("Unknown binary: " + process.argv[2])
            return process.exit(1) // eslint-disable-line no-process-exit
        }
    })())

    process.argv[1] = moduleName
    process.argv.splice(2, 1)
    return Module._load(moduleName, null, true)
}

return undefined
