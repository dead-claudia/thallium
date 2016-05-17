"use strict"

// Since the event loop appears to oddly dry up occasionally in the CLI. This
// implements the functionality of glob-stream, but it returns a promise and
// it's specialized for the following:
//
// - Ignores directories
// - It's always called with only strings.
//
// It's not yet used, and won't be until it is fully tested. Also, the
// dependencies are not yet listed.

const Promise = require("bluebird")
const Glob = require("glob").Glob
const micromatch = require("micromatch")
const resolveGlob = require("to-absolute-glob")
const path = require("path")

function globIsSingular(glob) {
    const globSet = glob.minimatch.set

    return globSet.length === 1 &&
        globSet[0].every(value => typeof value === "string")
}

function iterateGlob(glob, negatives, opts) {
    return new Promise((resolve, reject) => {
        // Remove path relativity to make globs make sense
        glob = resolveGlob(glob)

        // Create globbing stuff
        const globber = new Glob(glob, opts)

        function doRequire(file) {
            return !negatives.every(matcher => {
                if (typeof matcher === "function") {
                    return matcher(file)
                } else {
                    return matcher instanceof RegExp && matcher.test(file)
                }
            })
        }

        let found = false

        globber.on("error", e => {
            globber.abort()
            return reject(e)
        })

        globber.once("end", () => {
            if (!found && globIsSingular(globber)) {
                return reject(new Error(`Singular file not found: ${glob}`))
            } else {
                return resolve()
            }
        })

        globber.on("match", file => {
            found = true
            file = path.normalize(file)

            if (doRequire(file)) {
                require(file) // eslint-disable-line global-require
            }
        })
    })
}

// Creates a stream for multiple globs or filters
exports.create = globs => {
    if (!Array.isArray(globs)) globs = [globs]

    const positives = []
    const negatives = []
    const accumulator = []

    for (const glob of globs) {
        if (typeof glob === "string" && glob[0] === "!") {
            // Create Minimatch instances for negative glob patterns
            accumulator.push(micromatch.matcher(resolveGlob(glob)))
        } else if (glob instanceof RegExp) {
            accumulator.push(glob)
        } else {
            positives.push(glob)
            negatives.push(accumulator.slice())
        }
    }

    if (positives.length === 0) {
        throw new Error("Missing positive glob")
    }

    const opts = {
        nodir: true,
        symlinks: {},
        statCache: {},
        realpathCache: {},
        cache: {},
        // Reduce the number of unique comparisons.
        nounique: true,
    }

    // Iterate all globs, requiring every module it can it finds an error.
    return Promise.map(positives, (glob, i) =>
        iterateGlob(glob, negatives[i], opts))
}
