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

var Promise = require("bluebird")
var Glob = require("glob").Glob
var micromatch = require("micromatch")
var resolveGlob = require("to-absolute-glob")
var path = require("path")

function globIsSingular(glob) {
    var globSet = glob.minimatch.set

    if (globSet.length !== 1) return false

    var set = globSet[0]

    for (var i = 0; i < set.length; i++) {
        if (typeof set[i] !== "string") return false
    }

    return true
}

function ignoreFile(file, matcher) {
    if (typeof matcher === "function") {
        return matcher(file)
    } else {
        return matcher instanceof RegExp && matcher.test(file)
    }
}

function iterateGlob(glob, negatives, opts) {
    return new Promise(function (resolve, reject) {
        // Remove path relativity to make globs make sense
        glob = resolveGlob(glob)

        // Create globbing stuff
        var globber = new Glob(glob, opts)

        function doRequire(file) {
            for (var i = 0; i < negatives.length; i++) {
                if (!ignoreFile(file, negatives[i])) return true
            }

            return false
        }

        var found = false

        globber.on("error", function (e) {
            globber.abort()
            return reject(e)
        })

        globber.once("end", function () {
            if (!found && globIsSingular(globber)) {
                return reject(new Error("Singular file not found: " + glob))
            } else {
                return resolve()
            }
        })

        globber.on("match", function (file) {
            found = true
            file = path.normalize(file)

            if (doRequire(file)) {
                require(file) // eslint-disable-line global-require
            }
        })
    })
}

// Creates a stream for multiple globs or filters
exports.create = function (globs) {
    if (!Array.isArray(globs)) globs = [globs]

    var positives = []
    var negatives = []
    var accumulator = []

    for (var i = 0; i < globs.length; i++) {
        var glob = globs[i]

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

    var opts = {
        nodir: true,
        symlinks: {},
        statCache: {},
        realpathCache: {},
        cache: {},
        // Reduce the number of unique comparisons.
        nounique: true,
    }

    // Iterate all globs, requiring every module it can it finds an error.
    return Promise.map(positives, function (glob, i) {
        return iterateGlob(glob, negatives[i], opts)
    })
}
