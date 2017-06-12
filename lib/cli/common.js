"use strict"

var path = require("path")
var Util = require("../util")
var assert = Util.assert

var hasOwn = Object.prototype.hasOwnProperty

// Since the glob-parent implementation is that simple, might as well
// internalize it. I've combined the is-glob and is-extglob into this as well.

// NOTE: All updates to this method *must* be mirrored to the identically named
// function in `./init`
exports.globParent = function (str) {
    assert(typeof str === "string")

    // preserves full path in case of trailing path separator
    str = path.normalize(path.join(str, "a"))

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}

/**
 * Merge the arguments from parseArgs with the given config.
 *
 * Note that `load` is the `util.load` from the state, and used for easy
 * mocking.
 */
exports.merge = function (opts) {
    assert(opts != null && typeof opts === "object")

    return Promise.resolve(opts.config)
    .then(resolveDefault)
    .then(function (t) {
        // Filter for only our private `_` member.
        if (t != null && typeof t === "object") {
            if (t._ != null && typeof t._ === "object") return t
        }

        return opts.load("thallium", opts.baseDir).then(resolveDefault)
    })
    .then(function (t) {
        var files

        // Only merge if no files were explicitly specified on the command line.
        if (t.files != null && opts.isDefault) {
            files = t.files.map(function (file) {
                return normalizeGlob(file, opts.baseDir)
            })
        } else {
            files = opts.files.map(function (file) {
                return normalizeGlob(file)
            })
        }

        return {t: t, files: files}
    })
}

exports.isObjectLike = function (v) {
    return v != null && (typeof v === "object" || typeof v === "function")
}

// Resolve ES6 transpiled modules as well as default-export CommonJS modules
// This also works with actual ES modules.
exports.resolveDefault = resolveDefault
function resolveDefault(mod) {
    return mod != null &&
            typeof mod === "object" &&
            !Array.isArray(mod) &&
            hasOwn.call(mod, "default")
        ? mod.default : mod
}

exports.normalizeGlob = normalizeGlob
function normalizeGlob(glob, cwd) {
    assert(typeof glob === "string")
    assert(cwd == null || typeof cwd === "string")

    // store first and last characters before glob is modified
    var isNegated = glob[0] === "!"
    var hasTrailing = /[\\\/]$/.test(glob)

    if (isNegated) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && !/[\\\/]$/.test(glob)) glob += path.sep
    return isNegated ? "!" + glob : glob
}
