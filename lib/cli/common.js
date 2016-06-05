"use strict"

var path = require("path")
var Promise = require("bluebird")
var m = require("../messages.js")

var hasOwn = Object.prototype.hasOwnProperty

/**
 * Here's a TypeScript-like description of the expected config export (after
 * being resolved as a possible thenable):
 *
 * ```ts
 * interface Config {
 *     // Thallium instance, defaults to `require("thallium")`
 *     thallium?: string;
 *
 *     // List of file globs to add.
 *     files?: string | string[];
 * }
 * ```
 *
 * Note that `files` are overridable by the command line. `module` is ignored
 * when `thallium` is passed, but is still validated.
 */

function getType(value) {
    if (value == null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

// Exported for testing.
exports.validate = function (config) {
    var validated = {}

    if (hasOwn.call(config, "thallium")) {
        var t = config.thallium

        if (typeof t !== "object" || t == null || Array.isArray(t)) {
            throw new TypeError(m("type.cli.config.thallium", getType(t)))
        }

        validated.thallium = t
    }

    if (hasOwn.call(config, "files")) {
        var files = config.files

        if (Array.isArray(files)) {
            for (var i = 0; i < files.length; i++) {
                var pair = files[i]

                if (typeof pair !== "string") {
                    throw new TypeError(
                        m("type.cli.config.files.entry", i, getType(pair)))
                }
            }

            validated.files = files
        } else if (typeof files === "string") {
            validated.files = [files]
        } else {
            throw new TypeError(m("type.cli.config.files", getType(files)))
        }
    }

    return validated
}

function mergeFiles(checked, files, baseDir) {
    // Only merge if no files were explicitly specified on the command line.
    if (checked.files != null && files.length === 0) {
        return checked.files.map(function (file) {
            return exports.normalizeGlob(file, baseDir)
        })
    } else {
        return files.map(function (file) {
            return exports.normalizeGlob(file)
        })
    }
}

/**
 * Merge the arguments from parseArgs with the given config.
 *
 * Note that `load` is the `util.load` from the state, and used for easy
 * mocking.
 */
exports.merge = function (files, config, load, baseDir) {
    var checked = exports.validate(config)

    return Promise.try(function () {
        if (checked.thallium != null) {
            // This is to pass straight through.
            return null
        } else {
            return load("thallium", baseDir)
        }
    })
    .then(function (mod) {
        return {
            thallium: mod == null
                ? checked.thallium
                : exports.resolveDefault(mod.exports),
            files: mergeFiles(checked, files, baseDir),
        }
    })
}

exports.isObjectLike = function (v) {
    return v != null && (typeof v === "object" || typeof v === "function")
}

function hasDefault(v) {
    return v != null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        hasOwn.call(v, "default")
}

// Resolve ES6 transpiled modules as well as default-export CommonJS modules
exports.resolveDefault = function (mod) {
    return hasDefault(mod) ? mod.default : mod
}

// Since the glob-parent implementation is that simple, might as well
// internalize it. I've combined the is-glob and is-extglob into this as well.

exports.globParent = function (str) {
    // preserves full path in case of trailing path separator
    str += "a"

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}

exports.normalizeGlob = function (glob, cwd) {
    // store first and last characters before glob is modified
    var isNegative = glob[0] === "!"
    var hasTrailing = glob.slice(-1) === "/"

    if (isNegative) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && glob.slice(-1) !== "/") glob += "/"
    return isNegative ? "!" + glob : glob
}
