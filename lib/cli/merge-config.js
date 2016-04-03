"use strict"

var m = require("../messages.js").m

/**
 * Here's a TypeScript-like description of the expected config export (after
 * being resolved as a possible thenable):
 *
 * ```ts
 * interface Config {
 *     // Techtonic module name, defaults to `techtonic`
 *     module?: string;
 *
 *     // Techtonic instance, defaults to `require("techtonic")`
 *     techtonic?: string;
 *
 *     // List of file globs to add.
 *     files?: string | string[];
 * }
 * ```
 *
 * Note that `files` are overridable by the command line. `module` is ignored
 * when `techtonic` is passed, but is still validated.
 */

var hasOwn = Object.prototype.hasOwnProperty

// Exported for testing.
exports.validate = validate
function validate(config) {
    var ret = {}

    function check(field, run) {
        if (hasOwn.call(config, field)) {
            ret[field] = run(config[field])
        }
    }

    function simple(field, type, test) {
        return check(field, function (value) {
            if (test(value)) return value
            throw new TypeError(m("type.cli.config", field, type, typeof value))
        })
    }

    simple("module", "string", function (v) { return typeof v === "string" })
    simple("techtonic", "object", function (v) {
        return typeof v === "object" && v != null && !Array.isArray(v)
    })

    check("files", function (files) {
        if (Array.isArray(files)) {
            for (var i = 0; i < files.length; i++) {
                var glob = files[i]

                if (typeof glob !== "string") {
                    throw new TypeError(m("type.cli.config.files", i, glob))
                }
            }

            return files
        }

        if (typeof files === "string") return [files]

        throw new TypeError(
            m("type.cli.config", "files", "string or array", typeof files))
    })

    return ret
}

/**
 * Merge the arguments from parseArgs with the given config.
 *
 * Note that `load` is a hook for mocks. During normal execution, it's set to
 * a version of `require` loading relative to the current working directory.
 */
exports.merge = function (files, config, load) {
    var checked = validate(config)

    var techtonic = checked.techtonic != null
        ? checked.techtonic
        : load(checked.module != null ? checked.module : "techtonic")

    files = files.slice()

    if (checked.files != null) files = files.concat(checked.files)

    return {techtonic: techtonic, files: files}
}
