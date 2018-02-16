"use strict"

/* eslint-disable global-require */

var fs = require("fs")
var path = require("path")
var GlobStream

/**
 * @file
 * The injected utilities for actually running the CLI. If you need to port the
 * CLI to any other platform, make a file implementing these methods:
 *
 * - `load(file, baseDir)` - Resolve and load a module.
 * - `read(file)` - Read the contents of a file.
 * - `stat(file)` - Retrieve a stat for the file. It expects a module with two
 *   boolean methods: `stat.isFile()` and `stat.isDirectory()`.
 * - `readdir(dir)` - Get a directory listing.
 * - `resolve(file)` - Resolve a file relative to the current working directory,
 *   if it's not already absolute.
 * - `printHelp(file)` - Read the help file and print it.
 * - `chdir(directory)` - Change the current working directory.
 * - `cwd()` - Get the current working directory.
 * - `readGlob(globs)` - Execute a glob, loading each file matched by it.
 *
 * Then, you can make a new entry script like this:
 *
 * ```js
 * var parse = require("./args").parse
 * var Util = require("./util")
 * var Run = require("./run")
 *
 * Run.run(parse(argv), Util)
 * .catch(function (e) {
 *     printError(e.stack)
 *     return 1
 * })
 * .then(exit)
 * ```
 *
 * And you're good to go.
 */

exports.load = function (file, baseDir) {
    return new Promise(function (resolve) {
        // Hack: hijack Node's internal resolution algorithm to require the file
        // as if from a fake module in the correct base directory. It also will
        // avoid several bugs with the `resolve` module (Node's is necessarily
        // more stable).
        var dirname = path.resolve(baseDir)
        var m = new module.constructor(path.join(dirname, "dummy.js"))

        m.filename = m.id
        m.paths = module.constructor._nodeModulePaths(dirname)
        m.loaded = true
        resolve(m.require(file))
    })
}

exports.read = function (file) {
    return fs.readFileSync(path.resolve(file), "utf-8")
}

exports.stat = function (file) {
    return fs.statSync(path.resolve(file))
}

exports.readdir = function (dir) {
    return fs.readdirSync(path.resolve(dir))
}

exports.resolve = function () {
    return path.resolve.apply(undefined, arguments)
}

exports.chdir = process.chdir
exports.cwd = process.cwd
exports.exit = process.exit

exports.readEnv = function (key) {
    return process.env[key]
}

exports.setEnv = function (key, value) {
    process.env[key] = value
}

exports.printError = function (value) {
    console.error(value)
}

exports.respawn = function (opts) {
    /* eslint-disable-line */
    var program = opts.program != null ? opts.program : process.argv[0]
    var args = opts.nodeOptions.concat(
        [path.resolve(__dirname, "../../bin/tl.js")],
        opts.tlOptions
    )

    require("child_process").spawn(program, args, {
        env: process.env,
        stdio: "inherit",
        shell: program !== process.argv[0],
    })
    .on("exit", function (code) { if (code != null) exports.exit(code) })
    .on("close", function (code) { if (code != null) exports.exit(code) })
    .on("error", function (e) {
        console.error(e.stack)
        exports.exit(1)
    })
}

exports.printHelp = function (helpType) {
    var contents = fs.readFileSync(
        path.join(__dirname, "help-" + helpType + ".txt"),
        "utf-8"
    )

    // Pad the top by a line.
    console.log()
    console.log(process.platform === "win32"
        ? contents.replace("\n", "\r\n")
        : contents)
}

exports.readGlob = function (glob) {
    // Load this lazily, since it's loaded prior to actual runtime loading.
    if (GlobStream == null) GlobStream = require("./glob-stream")
    return new Promise(function (resolve, reject) {
        GlobStream.create(glob, {
            send: require,
            warn: function (str) { console.warn("WARNING: " + str) },
            end: resolve,
            error: reject,
        })
    })
}
