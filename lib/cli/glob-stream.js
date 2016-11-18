"use strict"

/**
 * This is a specialized version of glob-stream + some of its dependencies,
 * where it assumes all paths to be absolute, the argument to only be a single
 * array, and dot files are always ignored. It's roughly equivalent to
 * `gs.create(files)`, but with everything hardcoded in and optimized. This is
 * necessary to help speed up a very slow `require` chain.
 *
 * Also, it only outputs the path itself - none of the other things like `cwd`
 * or `base`
 */

var path = require("path")
var Glob = require("glob").Glob
var Minimatch = require("minimatch").Minimatch
var methods = require("../methods")
var Transform = require("stream").Transform

var hasOwn = Object.prototype.hasOwnProperty

function alwaysTrue() {
    return true
}

exports.Through = Through
function Through(func, arg) {
    Transform.call(this, {objectMode: true})
    this.func = func != null ? func : alwaysTrue
    this.arg = arg
}

methods(Through, Transform, {
    _transform: function (file, _, callback) {
        if ((0, this.func)(this.arg, file)) {
            return callback(undefined, file)
        } else {
            return callback()
        }
    },
})

function isReadable(stream) {
    return stream !== null && typeof stream === "object" &&
        typeof stream.pipe === "function" &&
        stream.readable !== false &&
        typeof stream._read === "function" &&
        typeof stream._readableState === "object"
}

exports.addStream = addStream
function addStream(cache, combined, streams, stream) {
    if (!isReadable(stream)) {
        throw new Error("All input streams must be readable")
    }

    stream._buffer = []

    stream.on("data", function (file) {
        if (!hasOwn.call(cache, file)) {
            cache[file] = true

            if (stream === streams[0]) {
                combined.push(file)
            } else {
                stream._buffer.push(file)
            }
        }
    })

    stream.on("end", function () {
        var i = 0
        var len = streams.length

        while (i < len && streams[i]._readableState.ended) {
            var stream = streams[i]

            for (var j = 0; j < stream._buffer.length; j++) {
                combined.push(stream._buffer[j])
            }

            i++
        }

        streams.splice(0, i)

        if (i === len) {
            combined.push(null)
        }
    })

    stream.on("error", function (err) { combined.emit("error", err) })
    stream.on("warn", function (err) { combined.emit("warn", err) })
}

function globIsSingular(glob) {
    var globSet = glob.minimatch.set

    if (globSet.length !== 1) return false

    var globs = globSet[0]

    for (var i = 0; i < globs.length; i++) {
        if (typeof globs[i] !== "string") return false
    }

    return true
}

function shouldInclude(negatives, file) {
    for (var i = 0; i < negatives.length; i++) {
        if (!negatives[i].match(file)) return false
    }

    return true
}

// Creates a stream for a single glob or filter
function streamFromPositive(negatives, positive, globOpts) {
    var negativeGlobs = []

    for (var i = 0; i < negatives.length; i++) {
        var obj = negatives[i]

        if (obj.index > positive.index) {
            negativeGlobs.push(obj.glob)
        }
    }

    // Remove path relativity to make globs make sense
    var glob = positive.glob
    var globber = new Glob(glob, globOpts)

    // Create stream and map events from globber to it
    var stream

    if (negativeGlobs.length) {
        stream = new Through(shouldInclude, negativeGlobs)
    } else {
        stream = new Through()
    }

    var found = false

    globber.on("error", function (err) { stream.emit("error", err) })

    globber.on("match", function (file) {
        found = true
        stream.write(path.normalize(file))
    })

    globber.on("end", function () {
        if (!found && globIsSingular(globber)) {
            stream.emit("warn", "File not found with singular glob: " + glob)
        }

        stream.end()
    })

    return stream
}

function sortGlobs(positives, negatives, globs) {
    for (var i = 0; i < globs.length; i++) {
        var glob = globs[i]

        if (typeof glob !== "string") {
            throw new Error("Invalid glob at index " + i)
        }

        if (glob[0] === "!") {
            negatives.push({
                index: i,
                // Create Minimatch instances for negative glob patterns
                glob: new Minimatch(glob),
            })
        } else {
            positives.push({index: i, glob: glob})
        }
    }
}

// Creates a stream for multiple globs or filters
exports.create = function (globs) {
    if (!Array.isArray(globs)) {
        throw new TypeError("Glob list must be an array")
    }

    var positives = []
    var negatives = []

    sortGlobs(positives, negatives, globs)

    if (positives.length === 0) {
        throw new Error("Missing positive glob")
    }

    var globOpts = {
        nodir: true,
        cache: Object.create(null),
        statCache: Object.create(null),
        symlinks: Object.create(null),
        realpathCache: Object.create(null),
    }

    // Only one positive glob no need to aggregate
    if (positives.length === 1) {
        return streamFromPositive(negatives, positives[0], globOpts)
    }

    // Create all individual streams

    var pathCache = Object.create(null)
    var aggregate = new Through()
    var streams = []

    for (var i = 0; i < positives.length; i++) {
        var stream = streamFromPositive(negatives, positives[i], globOpts)

        streams.push(stream)
        addStream(pathCache, aggregate, streams, stream)
    }

    return aggregate
}
