"use strict"

const path = require("path")
const minimatch = require("minimatch")
const interpret = require("interpret")
const t = require("../index.js")
const State = require("../lib/cli/run.js").State
const LoaderData = require("../lib/cli/loader-data.js")

function notFound(file) {
    const e = new Error(`Cannot find module '${file}'`)

    e.code = "MODULE_NOT_FOUND"
    return e
}

function initTree(files, listing, file, entry) {
    if (typeof entry === "string") {
        // Node tries to execute unknown extensions as JS, but this is better.
        entry = file => { throw new Error(`${file} is not executable!`) }
    }

    if (entry == null) {
        throw new TypeError(`value for entry ${file} must exist`)
    } else if (typeof entry === "function") {
        files.set(file, entry)
        listing.push(file)
    } else {
        files.set(file, {type: "directory"})
        for (const child of Object.keys(entry)) {
            initTree(files, listing, path.resolve(file, child), entry[child])
        }
    }
}

exports.mock = tree => {
    const files = new Map()
    const listing = []
    let cwd = process.platform === "win32" ? "C:\\" : "/"

    initTree(files, listing, cwd, tree)

    const resolve = file => path.resolve(cwd, file)
    const resolveGlob = glob =>
        glob[0] === "!" ? `!${resolve(glob.slice(1))}` : resolve(glob)

    const fixGlob = glob =>
        Array.isArray(glob) ? glob.map(resolveGlob) : resolveGlob(glob)

    function load(file) {
        let target = resolve(file)

        // Directories are initialized as objects.
        if (!files.has(target)) throw notFound(file)

        let func = files.get(target)

        if (typeof func !== "function") {
            func = files.get(target = path.join(target, "index.js"))
        }

        if (typeof func !== "function") throw notFound(file)

        return func(target)
    }

    return {
        readGlob(glob) {
            const mm = new minimatch.Minimatch(fixGlob(glob), {
                nocase: process.platform === "win32",
                nocomment: true,
            })

            for (const item of listing) {
                if (mm.match(item)) load(item)
            }
        },

        load, resolve,
        cwd: () => cwd,
        chdir(dir) { cwd = resolve(dir) },
        exists: file => files.has(resolve(file)),
        existsSync: file => files.has(resolve(file)),
    }
}

exports.state = (argv, util) => new State({cwd: util.cwd(), argv, util})

exports.Loader = class Loader {
    constructor(argv, util) {
        if (typeof argv === "string") {
            argv = argv.trim()
            argv = argv ? argv.split(/\s+/g) : []
        }

        this.state = new State({cwd: util.cwd(), argv, util})
        this.load = util.load
    }

    // Partially copied from the module itself. Checks and cleans the
    // map of default keys.
    clean(map) {
        Object.keys(interpret.jsVariants).forEach(ext => {
            const mod = interpret.jsVariants[ext]

            if (!mod || !map.has(ext)) return

            const value = map.get(ext)

            // Skip any custom or out-of-order modules.
            if (!value.original) return

            t.deepEqual(value, Object.assign(
                new LoaderData.Register(ext, mod, this.load),
                {original: true}
            ))

            map.delete(ext)
        })

        return map
    }

    require(ext, mod, use) {
        return new LoaderData.Register(ext, mod, this.load, use)
    }

    register(ext, use) {
        return this.require(ext, interpret.jsVariants[ext], use)
    }
}
