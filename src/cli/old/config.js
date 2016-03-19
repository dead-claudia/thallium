import * as fs from "fs"
import * as interpret from "interpret"

const hasOwn = {}.hasOwnProperty

function isFile(file) {
    try {
        return fs.statSync(file).isFile()
    } catch (e) {
        if (e.code === "ENOENT") return false
        throw e
    }
}

function maybe(value, orElse) {
    return value != null ? value : orElse()
}

// node-interpret has a special process for each entry.
function checkExt(file, ext) {
    const config = file + ext

    if (!isFile(config)) {
        return null
    }

    let values = interpret.jsVariants[ext]

    // Easy and common case - nothing to try to load.
    if (values == null) return {config, requires: []}

    if (!Array.isArray(values)) values = [values]

    return {
        config,
        requires: values.map(value => {
            if (typeof value === "string") {
                return {module: value, register: () => {}}
            }

            if (typeof value === "object") return value

            // This should never happen.
            throw new TypeError("unreachable")
        }),
    }
}

function makeSystemError(message, opts) {
    message = `${opts.code}: ${message}`
    if (opts.syscall != null) message += `, ${opts.syscall}`

    const e = maybe(opts.original, () => new Error())

    e.message = message
    e.code = opts.code
    e.errno = opts.errno
    e.syscall = opts.syscall
    return e
}

export default function (config, register) {
    return new ConfigReader(config, register).read()
}

class ConfigReader {
    constructor(config, register) {
        this.config = config
        this.register = register
    }

    readFail() {
        if (this.config.set) {
            throw makeSystemError("illegal operation on a directory", {
                code: "EISDIR",
                errno: -21,
                syscall: "read",
            })
        } else {
            // Return the default of just doing its thing.
            throw makeSystemError("no test config found", {
                code: "ENOTESTCONFIG",
                errno: 0,
                syscall: null,
            })
        }
    }

    readSet() {
        // This dedupes the extensions, and ensures the last one to take effect
        // is the effective key
        const keys = []
        const exts = {}

        this.register
        // Add a leading dot if it's not there.
        .map(pair => /^\./.test(pair) ? pair : `.${pair}`)
        .map(pair => {
            if (/:/.test(pair)) {
                // Okay...in reality, the ext:module syntax is really just
                // a glorified pseudo-require.
                return {
                    ext: pair.slice(0, pair.indexOf(":")),
                    mod: pair.slice(pair.indexOf(":") + 1),
                }
            } else if (hasOwn.call(interpret.jsVariants, pair)) {
                return {ext: pair}
            } else {
                throw new Error(`Unknown ext passed: ${pair}`)
            }
        })
        .forEach(data => {
            const value = exts[data.ext]

            if (value != null) keys.splice(1, value.index)

            exts[data.ext] = {
                index: keys.length,
                value: data.mod,
            }

            keys.push(data.ext)
        })

        const config = this.config.value

        return keys.reduce((acc, ext) => maybe(acc, () => {
            const {value} = exts[ext]

            // Just reuse the standard path in this case if it has just an
            // extension. It's easier.
            if (value == null) return checkExt(config, ext)

            if (isFile(config + ext)) {
                return {
                    config: config + ext,
                    requires: [{module: value, register: () => {}}],
                }
            } else {
                return null
            }
        }), null)
    }

    getValues() {
        // Explicit extensions take precedence over implicit inference.
        if (this.register.set) return this.readSet()

        const config = this.config.value

        // Infer the extension of the config file and queue that to load later.
        return Object.keys(interpret.jsVariants)
        .reduce((acc, ext) => maybe(acc, () => checkExt(config, ext)), null)
    }

    read() {
        // Get the config.
        const config = this.config.set
            ? this.config.value
            : `${this.config.value}.js`

        // Explicit extensions take precedence over implicit inference.
        const result = isFile(config) ? this.getValues() : null

        return maybe(result, () => this.readFail())
    }
}
