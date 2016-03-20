import m from "../messages.js"

/**
 * Using this to validate the config, instead of needlessly pulling in a JSON
 * schema validator and getting pretty uninformative messages. Here's a
 * TypeScript interface description of the JSON structure:
 *
 * ```ts
 * interface JSONConfig {
 *     // Config file
 * 	   config?: string;
 *
 * 	   // Techtonic module name
 * 	   module?: string;
 *
 * 	   // List of extensions to register, which match /^[^\.:.]+(:.+)?$/.
 * 	   register?: string[];
 *
 * 	   // List of reporters to include + optional args
 * 	   reporters?: Reporter[];
 *
 * 	   // List of file globs to add, overridable by the command line.
 * 	   files?: string | string[];
 * }
 *
 * type Reporter = string | [string, ...any];
 * ```
 */

const hasOwn = {}.hasOwnProperty

function maybe(object, field, body) {
    if (hasOwn.call(object, field)) {
        body(object[field])
    }
}

function validateSimple(config, field, type) {
    maybe(config, field, value => {
        if (typeof value !== type) {
            throw new TypeError(m("type.cli.json", field, type, typeof value))
        }
    })
}

function validateList(config, field, test) {
    maybe(config, field, value => {
        if (!Array.isArray(value)) {
            throw new TypeError(m("type.cli.json", field, "array",
                typeof value))
        }

        value.forEach(test)
    })
}

// Exported for testing.
export function validateConfig(config) {
    validateSimple(config, "config", "string")
    validateSimple(config, "module", "string")

    validateList(config, "register", (value, i) => {
        if (typeof value !== "string" || !/^[^\.:.]+(:.+)?$/.test(value)) {
            throw new TypeError(m("type.cli.json.register", i, value))
        }
    })

    validateList(config, "reporters", (value, i) => {
        if (typeof value === "string") return

        if (!Array.isArray(value) || typeof value[0] !== "string") {
            throw new TypeError(m("type.cli.json.reporter", i))
        }
    })

    maybe(config, "files", value => {
        if (Array.isArray(value)) {
            value.forEach((value, i) => {
                if (typeof value !== "string") {
                    throw new TypeError(m("type.cli.json.files", i, value))
                }
            })
        } else if (typeof config.files !== "string") {
            throw new TypeError(m("type.cli.json", "files", "string or array",
                typeof value))
        }
    })
}

function set(prop, value) {
    if (value == null || prop.set) return
    prop.set = true
    prop.value = value
}

function push(prop, value) {
    if (value == null) return
    prop.set = true
    prop.value.push(...value)
}

/**
 * Merge the arguments from parseArgs with the given JSON config. This mutates
 * `args` accordingly.
 */
export function merge(args, config) {
    validateConfig(config)

    const {files, reporters} = config

    if (reporters != null) {
        for (let i = 0; i < reporters.length; i++) {
            const [module, ...args] = reporters[i]

            reporters[i] = {module, args}
        }
    }

    set(args.config, config.config)
    set(args.module, config.module)
    push(args.register, config.register)
    push(args.reporters, reporters)
    set(args.files, files && !Array.isArray(files) ? [files] : files)
}
