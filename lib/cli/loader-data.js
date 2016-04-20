"use strict"

const path = require("path")
const interpret = require("interpret")

// There's no neater way to do this.
const allExts = new RegExp(`.(${
    Object.keys(interpret.jsVariants)
    .map(ext => ext.replace(/\./g, "\\."))
    .join("|")
})$`)

const isValid = exports.isValid = file => allExts.test(path.basename(file))
const getExt = exports.getExt = file => allExts.exec(path.basename(file))[1]

class Register {
    constructor(ext, value, load, use) {
        // This only exists for debugging purposes.
        this.ext = ext
        this.value = value
        this.require = load
        this.loaded = false
        this.use = !!use

        // This is only for testing.
        this.original = false
    }

    registerSingle(entry) {
        try {
            if (typeof entry === "string") {
                (0, this.require)(entry)
            } else {
                entry.register((0, this.require)(entry.module))
            }

            return true
        } catch (e) {
            return false
        }
    }

    register() {
        // Don't waste time with that if it's already loaded.
        if (!this.loaded && this.use) {
            if (Array.isArray(this.value)) {
                if (!this.value.some(this.registerSingle, this)) {
                    throw new Error(`Could not register extension ${this.ext}`)
                }
            } else if (!this.registerSingle(this.value)) {
                throw new Error(`Could not register extension ${this.ext}`)
            }

            this.loaded = true
            this.ext = this.value = this.require = null
        }
    }
}
// Exported for testing
exports.Register = Register

class Simple {
    constructor(module, load) {
        this.module = module
        this.require = load
        this.loaded = false

        // Placeholder to mark an assumption made in the config location
        // inference algorithm.
        this.use = true
    }

    register() {
        if (!this.loaded) {
            this.require(this.module)
            this.loaded = true
            this.module = this.require = null
        }
    }
}
// Exported for testing
exports.Simple = Simple

// A sentinel for JS configs, exported for testing
const jsLoader = exports.jsLoader = {
    ext: ".js",
    use: true,
    original: true,
    register() {},
}

class Extractor {
    constructor(state) {
        this.map = new Map()
        this.load = state.util.load
    }

    put(ext, mod, use) {
        this.map.set(ext, new Register(ext, mod, this.load, use))
    }

    putExt(ext, original) {
        const mod = interpret.jsVariants[ext]

        // Don't include natively implemented extensions. The loaders make
        // the assumption there's something to load.
        if (mod && !this.map.has(ext)) {
            this.put(ext, mod, false)
            if (original) this.map.get(ext).original = true
        }
    }
}

exports.extractIntoMap = state => {
    const extractor = new Extractor(state)

    let dummy = 0

    for (const entry of state.args.require) {
        const index = entry.indexOf(":")

        if (index >= 0) {
            let ext = entry.slice(0, index)

            if (ext[0] !== ".") ext = `.${ext}`
            extractor.put(ext, entry.slice(index + 1), true)
        } else {
            extractor.map.set(dummy++, new Simple(entry, extractor.load))
        }
    }

    // Globs and files without known extensions are obviously useless.
    if (state.args.config != null && isValid(state.args.config)) {
        extractor.putExt(getExt(state.args.config))
    }

    for (const file of state.args.files) {
        // Globs and files without known extensions are obviously useless.
        if (file != null && isValid(file)) {
            extractor.putExt(getExt(file))
        }
    }

    // This takes precedence over other extensions.
    if (!extractor.map.has(".js")) extractor.map.set(".js", jsLoader)

    for (const ext of Object.keys(interpret.jsVariants)) {
        extractor.putExt(ext, true)
    }

    return extractor.map
}
