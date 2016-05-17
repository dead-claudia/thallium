"use strict"

const path = require("path")
const minimatch = require("minimatch")
const interpret = require("interpret")
const t = require("../index.js")
const State = require("../lib/cli/run.js").State
const LoaderData = require("../lib/cli/loader-data.js")

exports.fixture = dir => path.resolve(__dirname, "../test-fixtures", dir)

function notFound(file) {
    const e = new Error(`Cannot find module '${file}'`)

    e.code = "MODULE_NOT_FOUND"
    return e
}

// Fake a Node `fs` errpr
function fsError(opts) {
    let message = `${opts.code}: ${opts.message}`

    if (opts.syscall != null) message += `, ${opts.syscall}`
    if (opts.path != null) message += ` '${opts.path}'`

    const e = new Error(message)

    if (opts.errno != null) e.errno = opts.errno
    if (opts.code != null) e.code = opts.code
    if (opts.syscall != null) e.syscall = opts.syscall
    if (opts.path != null) e.path = opts.path
    return e
}

function initTree(files, listing, file, entry) {
    if (entry == null) {
        throw new TypeError(`value for entry ${file} must exist`)
    } else if (typeof entry === "string") {
        // Node tries to execute unknown extensions as JS, but this is better.
        files.set(file, type => {
            if (type === "read") return entry
            throw new Error(`${file} is not executable!`)
        })
        listing.push(file)
    } else if (typeof entry === "function") {
        // Cache the load, like Node.
        let value

        files.set(file, type => {
            if (type === "load") {
                if (entry == null) return value
                return value = entry()
            }
            throw new Error(`${file} shouldn't be read!`)
        })
        listing.push(file)
    } else {
        files.set(file, {type: "directory"})
        for (const child of Object.keys(entry)) {
            initTree(files, listing, path.resolve(file, child), entry[child])
        }
    }
}

// Mock the node-interpret modules that are associated with a `register` method.
const interpretMocks = {
    "babel-register": () => {},
    "babel-core/register": () => {},
    "babel/register": () => {},
    "node-jsx": () => ({install() {}}),
}

const interpretModules = {}

for (const key of Object.keys(interpret.jsVariants)) {
    const mod = interpret.jsVariants[key]

    if (mod == null) {
        // do nothing - it's a native extension.
    } else if (typeof mod === "string") {
        interpretModules[mod] = true
    } else if (!Array.isArray(mod)) {
        interpretModules[mod.module] = true
    } else {
        for (const part of mod) {
            if (typeof part === "string") {
                interpretModules[part] = true
            } else {
                interpretModules[part.module] = true
            }
        }
    }
}

exports.mock = tree => {
    const files = new Map()
    const listing = []
    let cwd = process.platform === "win32" ? "C:\\" : "/"

    initTree(files, listing, cwd, tree)

    function resolve(file) {
        return path.resolve(cwd, file)
    }

    function resolveGlobs(globs) {
        if (!Array.isArray(globs)) globs = [globs]

        if (globs.length === 1) {
            let cooked

            if (globs[0][0] === "!") {
                cooked = `!${resolve(globs[0].slice(1))}`
            } else {
                cooked = resolve(globs[0])
            }

            const mm = new minimatch.Minimatch(cooked, {
                nocase: process.platform === "win32",
                nocomment: true,
            })

            return file => mm.match(file)
        }

        const ignores = []
        const keeps = []

        for (const raw of globs) {
            let cooked, list

            if (raw[0] === "!") {
                cooked = resolve(raw.slice(1))
                list = ignores
            } else {
                cooked = resolve(raw)
                list = keeps
            }

            list.push(new minimatch.Minimatch(cooked, {
                nocase: process.platform === "win32",
                nocomment: true,
            }))
        }

        return file => {
            for (const mm of ignores) {
                if (mm.match(file)) return false
            }

            for (const mm of keeps) {
                if (mm.match(file)) return true
            }

            return false
        }
    }

    function load(file) {
        // Total hack, but it's easier than implementing Node's resolution
        // algorithm.
        if (file === "thallium") {
            return load("node_modules/thallium")
        }

        if (interpretMocks[file] != null) return interpretMocks[file]
        if (interpretModules[file]) return undefined

        const target = resolve(file)

        // Directories are initialized as objects.
        if (!files.has(target)) throw notFound(file)

        let func = files.get(target)

        if (typeof func !== "function") func = files.get(`${target}.js`)

        if (typeof func !== "function") {
            func = files.get(path.join(target, "index.js"))
        }

        if (typeof func !== "function") throw notFound(file)

        return func("load")
    }

    return {
        readGlob(globs) {
            const matcher = resolveGlobs(globs)

            for (const item of listing) {
                if (matcher(item)) load(item)
            }
        },

        read(file) {
            const target = resolve(file)

            // Directories are initialized as objects.
            if (!files.has(target)) {
                throw fsError({
                    path: file,
                    message: "no such file or directory",
                    code: "ENOENT",
                    errno: -2,
                    syscall: "open",
                })
            }

            const func = files.get(target)

            if (typeof func === "object") {
                throw fsError({
                    message: "illegal operation on a directory",
                    code: "EISDIR",
                    errno: -21,
                    syscall: "read",
                })
            }

            return func("read")
        },

        load, resolve,
        cwd: () => cwd,
        chdir(dir) { cwd = resolve(dir) },
        exists: file => typeof files.get(resolve(file)) === "function",
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
        for (const pair of Array.from(map)) {
            // Skip any custom or out-of-order modules.
            if (!pair[1].original) continue

            if (pair[0] === ".js") {
                t.deepEqual(pair[1], LoaderData.jsLoader)
            } else {
                const mod = interpret.jsVariants[pair[0]]

                t.deepEqual(pair[1], Object.assign(
                    new LoaderData.Register(pair[0], mod, this.load),
                    {original: true}
                ))
            }

            map.delete(pair[0])
        }

        return map
    }

    require(ext, mod, use) {
        return new LoaderData.Register(ext, mod, this.load, use)
    }

    register(ext, use) {
        return this.require(ext, interpret.jsVariants[ext], use)
    }
}
