import {m} from "../messages.js"

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

// Exported for testing.
export function validate(config) {
    const ret = {}

    function check(field, run) {
        if (hasOwn.call(config, field)) {
            ret[field] = run(config[field])
        }
    }

    function simple(field, type, test) {
        check(field, value => {
            if (!test(value)) {
                throw new TypeError(
                    m("type.cli.config", field, type, typeof value))
            }

            return value
        })
    }

    simple("module", "string", m => typeof m === "string")
    simple("techtonic", "object", m =>
        typeof m === "object" && m !== null && !Array.isArray(m))

    check("files", files => {
        if (Array.isArray(files)) {
            files.forEach((glob, i) => {
                if (typeof glob !== "string") {
                    throw new TypeError(m("type.cli.config.files", i, glob))
                }
            })
            return files
        } else if (typeof files === "string") {
            return [files]
        } else {
            throw new TypeError(
                m("type.cli.config", "files", "string or array", typeof files))
        }
    })

    return ret
}

/**
 * Merge the arguments from parseArgs with the given JSON config.
 *
 * Note that `load` is a hook for mocks. During normal execution, it's set to
 * a version of `require` loading relative to the current working directory.
 */
export function merge(files, config, load) {
    const checked = validate(config)

    const ret = {
        techtonic: null,
        files: files.slice(),
    }

    if (checked.techtonic != null) {
        ret.techtonic = checked.techtonic
    } else if (checked.module != null) {
        ret.techtonic = load(checked.module)
    } else {
        ret.techtonic = load("techtonic")
    }

    if (checked.files != null) {
        ret.files.push(...checked.files)
    }

    return ret
}
