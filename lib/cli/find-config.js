"use strict"

const path = require("path")
const globParent = require("./glob-parent.js")
const LoaderData = require("./loader-data.js")

// The dirname of the root is the root
const isRoot = dir => path.dirname(dir) === dir

class Utils {
    constructor(state, loaders) {
        this.exists = state.util.exists
        // calls to `exists` are cached to avoid numerous duplicate directory
        // reads.
        this.cache = new Map()
        this.loaders = loaders
    }

    check(file) {
        let res

        if (this.cache.has(file)) {
            res = this.cache.get(file)
        } else {
            res = this.exists(file)
            this.cache.set(file, res)
        }

        return res
    }

    walkUp(dir, base) {
        for (;;) {
            const file = path.join(dir, base)

            if (this.check(file)) return file
            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    }

    // 1. Get a list of all `.techtonic.{ext}` files.
    // 2. Find the first file to exist.
    // 3. If we can't find one and we're not at the root level, recurse upwards.
    search(dir) {
        for (;;) {
            const base = path.join(dir, ".techtonic")

            for (const pair of this.loaders) {
                const loader = pair[1]

                // Skip the extension-free loaders
                if (loader.ext) {
                    const file = base + loader.ext

                    if (this.check(file)) return file
                }
            }

            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    }

    // Try to find one with a matching extension, or failing that, one in JS.
    findExact(list) {
        for (const glob of list) {
            if (LoaderData.isValid(glob)) {
                const parent = globParent(glob)
                const ext = LoaderData.getExt(glob)
                const ret = this.walkUp(parent, `.techtonic${ext}`)

                if (ret != null) return ret
            }
        }

        for (const glob of list) {
            let ret

            if (LoaderData.isValid(glob)) {
                ret = this.walkUp(globParent(glob), ".techtonic.js")
            } else {
                ret = this.search(globParent(glob))
            }

            if (ret != null) return ret
        }

        return null
    }
}

module.exports = (state, loaders) => {
    const utils = new Utils(state, loaders)

    let raw

    if (state.args.config != null) {
        raw = state.args.config
    } else if (state.args.files.length !== 0) {
        raw = utils.findExact(state.args.files)
    } else {
        raw = utils.search("test")
    }

    if (raw == null) return null

    const resolved = path.resolve(state.args.cwd, raw)

    // The original iteration only checked arguments, not the file system.
    if (LoaderData.isValid(resolved)) {
        const ext = LoaderData.getExt(resolved)

        // This is meaningless for simple loaders, so it works.
        if (loaders.has(ext)) loaders.get(ext).use = true
    }

    return resolved
}
