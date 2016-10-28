"use strict"

var path = require("path")
var getType = require("../util").getType

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

// Exported for testing.
exports.validate = function (config) {
    var validated = {}

    if (hasOwn.call(config, "thallium")) {
        var t = config.thallium

        if (typeof t !== "object" || t == null || Array.isArray(t)) {
            throw new TypeError(
                "Expected config.thallium to be an object if it exists, but " +
                "found a(n) " + getType(t))
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
                        "Expected config.files[" + i + "] to be a string, " +
                        "but found a(n) " + getType(pair))
                }
            }

            validated.files = files
        } else if (typeof files === "string") {
            validated.files = [files]
        } else {
            throw new TypeError(
                "Expected config.files to be a string or array if it exists, " +
                "but found a(n) " + getType(files))
        }
    }

    return validated
}

function mergeFiles(files, opts) {
    // Only merge if no files were explicitly specified on the command line.
    if (files != null && opts.isDefault) {
        return files.map(function (file) {
            return normalizeGlob(file, opts.baseDir)
        })
    } else {
        return opts.files.map(function (file) { return normalizeGlob(file) })
    }
}

/**
 * Merge the arguments from parseArgs with the given config.
 *
 * Note that `load` is the `util.load` from the state, and used for easy
 * mocking.
 */
exports.merge = function (opts) {
    var checked = exports.validate(opts.config)

    return {
        thallium: checked.thallium != null
            ? checked.thallium
            : resolveDefault(opts.load("thallium", opts.baseDir)),
        files: mergeFiles(checked.files, opts),
    }
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
exports.resolveDefault = resolveDefault
function resolveDefault(mod) {
    return hasDefault(mod) ? mod.default : mod
}

exports.normalizeGlob = normalizeGlob
function normalizeGlob(glob, cwd) {
    // store first and last characters before glob is modified
    var isNegated = glob[0] === "!"
    var hasTrailing = /[\\\/]$/.test(glob)

    if (isNegated) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && !/[\\\/]$/.test(glob)) glob += path.sep
    return isNegated ? "!" + glob : glob
}
