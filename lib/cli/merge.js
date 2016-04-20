"use strict"

const m = require("../messages.js")

exports = module.exports = (state, config) => {
    return merge(state.args.files, config, state.util.load)
}

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

const hasOwn = Object.prototype.hasOwnProperty

class Validator {
    constructor(config) {
        this.config = config
        this.ret = {}
    }

    check(field, run) {
        if (hasOwn.call(this.config, field)) {
            this.ret[field] = run(this.config[field])
        }
    }

    simple(field, type, test) {
        return this.check(field, value => {
            if (test(value)) return value
            throw new TypeError(m("type.cli.config", field, type, typeof value))
        })
    }
}

// Exported for testing.
exports.validate = validate
function validate(config) {
    const validator = new Validator(config)

    validator.simple("module", "string", v => typeof v === "string")
    validator.simple("techtonic", "object", v => {
        return typeof v === "object" && v != null && !Array.isArray(v)
    })

    validator.check("files", files => {
        if (Array.isArray(files)) {
            for (const pair of files) {
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
exports.merge = merge
function merge(files, config, load) {
    const checked = validate(config)

    let techtonic

    if (checked.techtonic != null) {
        techtonic = checked.techtonic
    } else {
        const mod = checked.module != null ? checked.module : "techtonic"

        techtonic = load(mod)
    }

    if (config.files != null) files = files.concat(config.files)
    else files = files.slice()

    return {techtonic, files}
}
