"use strict"

var path = require("path")
var Common = require("../common.js")
var m = Common.m

var hasOwn = Object.prototype.hasOwnProperty

exports.mergeState = function (state, config, baseDir) {
    return exports.merge(state.args.files, config, state.util.load, baseDir)
}

/**
 * Here's a TypeScript-like description of the expected config export (after
 * being resolved as a possible thenable):
 *
 * ```ts
 * interface Config {
 *     // Thallium module name, defaults to `thallium`
 *     module?: string;
 *
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

function Validator(config) {
    this.config = config
    this.ret = {}
}

Common.methods(Validator, {
    check: function (field, run) {
        if (hasOwn.call(this.config, field)) {
            this.ret[field] = run(this.config[field])
        }
    },

    simple: function (field, type, test) {
        return this.check(field, function (value) {
            if (test(value)) return value
            throw new TypeError(m("type.cli.config", field, type, typeof value))
        })
    },
})

// Exported for testing.
exports.validate = function (config) {
    var validator = new Validator(config)

    validator.simple("module", "string", function (v) {
        return typeof v === "string"
    })

    validator.simple("thallium", "object", function (v) {
        return typeof v === "object" && v != null && !Array.isArray(v)
    })

    validator.check("files", function (files) {
        if (Array.isArray(files)) {
            for (var i = 0; i < files.length; i++) {
                var pair = files[i]

                if (typeof pair[1] !== "string") {
                    throw new TypeError(m("type.cli.config.files", pair[0],
                        pair[1]))
                }
            }

            return files
        }

        if (typeof files === "string") return [files]

        throw new TypeError(
            m("type.cli.config", "files", "string or array", typeof files))
    })

    return validator.ret
}

/**
 * Merge the arguments from parseArgs with the given config.
 *
 * Note that `load` is the `util.load` from the state, and used to enable mocks.
 */
exports.merge = function (files, config, load, baseDir) {
    var checked = exports.validate(config)

    var thallium

    if (checked.thallium != null) {
        thallium = checked.thallium
    } else {
        var mod = checked.module != null ? checked.module : "thallium"

        thallium = load(mod, baseDir)
    }

    // Only merge if no files were explicitly specified on the command line.
    if (checked.files != null && files.length === 0) {
        files = checked.files.map(function (file) {
            return exports.normalizeGlob(file, baseDir)
        })
    } else {
        files = files.map(function (file) {
            return exports.normalizeGlob(file)
        })
    }

    return {thallium: thallium, files: files}
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
