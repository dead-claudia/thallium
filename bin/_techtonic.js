"use strict"

if (require.main !== module) {
    throw new Error("This is not a module!")
}

process.title = "techtonic"

var fs = require("fs")
var path = require("path")
var resolve = require("resolve")
var interpret = require("interpret")
var gs = require("glob-stream")
var globParent = require("glob-parent")

var help = require("./cli-help.js")

function main() {
    var oldCwd = process.cwd()
    var opts = parseArgs(oldCwd)

    // This is a no-op if --cwd was not passed/is already the current working
    // directory.
    process.chdir(opts.args.cwd)

    var data = readConfig(opts.args, opts.set)
    fixExtension(data, opts.args, opts.set)

    var techtonic = loadRequires(data)
    var bail = finish.bind(null, oldCwd)

    return requireConfig(data, bail, function (result) {
        result = parseResult(opts.args, opts.set, techtonic, result)

        // Impure fixed-point combinator to clean up a *lot* of repetition.
        ;(function xs(fs) {
            if (fs.length) {
                try {
                    return fs[0](result, bail, xs.bind(null, fs.slice(1)))
                } catch (e) {
                    return bail(e)
                }
            }
        })([
            callHook.bind(null, "oninit"), loadTests,
            callHook.bind(null, "onload"), runTests,
            callHook.bind(null, "onend"), finish.bind(null, oldCwd, null),
        ])
    })
}

function makeNext(bail, next) {
    var called = false
    return function (err, data) {
        if (called) return
        called = true
        if (err != null) process.nextTick(bail, err)
        else process.nextTick(next, data)
    }
}

function parseArgs(oldCwd) {
    var args = {
        // These are resolved later.
        config: null,
        module: null,

        cwd: oldCwd,
        register: [],
        files: [],
    }

    var set = {
        // These are largely irrelevant, and are only here for consistency.
        config: false,
        cwd: false,

        // These matter.
        module: false,
        register: false,
        files: false,
    }

    var last

    for (var i = 2; i < process.argv.length; i++) {
        var arg = process.argv[i]

        if (last != null) {
            if (Array.isArray(args[last])) args[last].push(arg)
            else args[last] = arg
            set[last] = true
            last = null
        } else if (arg === "--") {
            i++
            break
        } else if (/^(-h|--help)$/.test(arg)) {
            help()
        } else if (/^(-hh|--help-detailed)$/.test(arg)) {
            help(true)
        } else if (/^(-c|--config)$/.test(arg)) {
            last = "config"
        } else if (/^(-m|--module)$/.test(arg)) {
            last = "module"
        } else if (/^(-r|--register)$/.test(arg)) {
            last = "register"
        } else if (arg === "--cwd") {
            last = "cwd"
        } else if (!/^-/.test(arg)) {
            args.files.push(arg)
        }
    }

    // Append the rest of the arguments as files.
    while (i < process.argv.length) args.files.push(process.argv[i++])

    if (args.files.length === 0) {
        args.files = [path.join(".", "test", "**")]
    } else {
        set.files = true
    }

    if (!set.config) {
        // Take the first item to infer the file from.
        args.config = path.join(globParent(args.files[0]), ".config")
    }

    return {args: args, set: set}
}

function makeSysError(message, code, errno, syscall, e) {
    message = code + ": " + message
    if (syscall != null) message += ", " + syscall
    if (e == null) e = new Error(message)
    else e.message = message
    e.code = code
    e.errno = errno
    e.syscall = syscall
    return e
}

// node-interpret has a special process for each promise.
function checkExt(file, ext) {
    var config = file + ext
    if (!fs.statSync(config).isFile()) {
        return null
    }

    var values = interpret.jsVariants[ext]

    // Easy and common case - nothing to try to load.
    if (values == null) return {config: config, values: []}

    if (!Array.isArray(values)) values = [values]

    return {
        config: config,
        values: values.map(function (value) {
            if (typeof value === "string") {
                return {module: value, register: function () {}}
            }

            if (typeof value === "object") return value

            // This should never happen.
            throw new TypeError("unreachable")
        }),
    }
}

function readConfigFail(set) {
    if (set.config) {
        throw makeSysError("illegal operation on a directory", "EISDIR", -21,
            "read")
    } else {
        throw makeSysError("no test config found", "ENOTESTCONFIG", 0, null)
    }
}

function readSetConfig(args, set) {
    var config = args.config

    // This dedupes the extensions, and ensures the last one to take
    // effect is the effective key
    var keys = []
    var exts = {}

    args.register.forEach(function (pair) {
        // Add a leading dot if it's not there.
        if (pair[0] !== ".") pair = "." + pair

        var ext, mod

        if (/:/.test(pair)) {
            // Okay...in reality, the ext:module syntax is really just
            // a glorified `require(module)`.
            ext = pair.slice(0, pair.indexOf(":"))
            mod = pair.slice(pair.indexOf(":") + 1)
        } else {
            if (!{}.hasOwnProperty.call(interpret.jsVariants, pair)) {
                throw new Error("Unknown ext passed: " + pair)
            }
            ext = pair
        }

        var value = exts[ext]
        if (value != null) keys.splice(1, value.index)

        exts[ext] = {
            index: keys.length,
            value: mod,
        }

        keys.push(ext)
    })

    for (var i = 0; i < keys.length; i++) {
        var ext = keys[i]
        var value = exts[ext].value

        if (value != null) {
            if (fs.stat(config + ext).isFile()) {
                return {
                    config: config + ext,
                    values: [{module: value, register: function () {}}],
                }
            }
        } else {
            // Just reuse the standard path if it has just an extension.
            // It's easier.
            var values = checkExt(config, ext)
            if (values != null) return values
        }
    }

    return readConfigFail(set)
}

function readConfig(args, set) {
    // Get the config.
    var config = set.config ? args.config : args.config + ".js"
    if (!fs.statSync(config).isFile()) {
        // Explicit extensions take precedence over implicit inference.
        if (set.register) {
            return readSetConfig(args, set)
        } else {
            // Infer the extension of the config file and queue that to load
            // later.
            var keys = Object.keys(interpret.jsVariants)

            for (var i = 0; i < keys.length; i++) {
                var ext = keys[i]
                var values = checkExt(args.config, ext)
                if (values != null) return values
            }

            return readConfigFail(set)
        }
    }
}

function fixExtension(args, set, data) {
    if (!set.files) {
        var ext = path.extname(data.config)
        args.files = [path.join(".", "test", "**", "*" + ext)]
    }
}

function loadRequires(data) {
    var opts = {basedir: path.dirname(data.config)}
    var techtonic = resolve.sync("techtonic", opts)

    for (var i = 0; i < data.requires.length; i++) {
        var req = data.requires[i]
        var res = resolve.sync(req)

        /* eslint-disable global-require */
        req.register(require(res))
        /* eslint-enable global-require */
    }

    return techtonic
}

function resolveCallback(func, inst, default_, bail, next) {
    if (typeof func !== "function") return process.nextTick(next, default_)
    var callback = makeNext(next, bail)

    try {
        var res = func.call(inst, callback)
        if (res != null && typeof res.then === "function") {
            res.then(callback.bind(null, null), callback)
        }
    } catch (e) {
        return callback(e)
    }
}

function callHook(name, result, bail, next) {
    return resolveCallback(result[name], result, undefined, bail, next)
}

function requireConfig(data, bail, next) {
    var result = require(data.config) // eslint-disable-line global-require
    return resolveCallback(result, undefined, result, bail, next)
}

// The null checks ensure that the correct default is used.
function parseResult(args, set, techtonic, result) {
    var files = result != null && !set.files && result.files != null
        ? result.files
        : args.files

    var mod = result != null && !set.module && result.module != null
        ? result.module
        : techtonic

    var t = result != null && result.techtonic != null
        ? result.techtonic
        : require(mod) // eslint-disable-line global-require

    return {result: result != null ? result : {}, files: files, t: t}
}

// TODO: optionally run tests in parallel. This will require an added internal
// reporter to do the messaging.

function loadTests(result, bail, next) {
    var callback = makeNext(bail, next)
    gs.createStream(result.files, {allowEmpty: true})
    .on("error", callback)
    .on("data", require)
    .on("end", callback)
}

function runTests(result, bail, next) {
    return result.t.run(makeNext(bail, next))
}

function finish(oldCwd, err) {
    process.chdir(oldCwd)
    if (err != null) {
        console.error(err)
        process.exit(1)
    } else {
        process.exit()
    }
}

main()
