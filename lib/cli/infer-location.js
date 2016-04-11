"use strict"

const assert = require("assert")
const path = require("path")
const globParent = require("./glob-parent.js")
const LoaderData = require("./loader-data.js")
const isValid = LoaderData.isValid
const getExt = LoaderData.getExt

// The dirname of the root is the root
const isRoot = dir => path.dirname(dir) === dir

class InferredData {
    constructor(files, loaders) {
        this.files = files
        this.loaders = loaders
    }
}

class Utils {
    constructor(state, loaders) {
        this.exists = state.util.exists
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

            if (this.cache.check(file)) return file
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

            for (const loader of this.loaders) {
                const file = base + loader.ext

                if (this.cache.check(file)) return file
            }

            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    }

    // Try to find an exact match, or failing that, one as if it were a glob.
    findExact(list) {
        for (const glob of list) {
            if (isValid(glob)) {
                const parent = globParent(glob)
                const ret = this.walkUp(parent, `.techtonic${getExt(glob)}`)

                if (ret != null) return ret
            }
        }

        for (const glob of list) {
            if (!isValid(glob)) {
                const ret = this.search(globParent(glob))

                if (ret != null) return ret
            }
        }

        return null
    }
}

module.exports = (state, loaders) => {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof state, "object")
        assert.notEqual(state, null)
        assert(loaders instanceof Map)
    }

    // `exists` is cached to avoid numerous duplicate directory reads.
    const utils = new Utils(state)

    let file

    if (state.args.config != null) {
        file = state.args.config
    } else if (state.args.files.length !== 0) {
        file = utils.findExact(state.args.files)
    } else {
        file = utils.search(globParent("test/**"))
    }

    if (file != null) {
        file = path.resolve(state.args.cwd, file)

        // The original iteration only checked arguments, not the file system.
        if (isValid(file)) {
            const ext = getExt(file)

            // This is meaningless for simple loaders, so it works.
            if (loaders.has(ext)) loaders.get(ext).use = true
        }
    }

    return new InferredData(file, loaders)
}

module.exports.InferredData = InferredData
