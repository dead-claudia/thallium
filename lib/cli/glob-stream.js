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

var assert = require("../util").assert

var hasOwn = Object.prototype.hasOwnProperty

exports.merge = merge
function merge(sources, listener) {
    assert(Array.isArray(sources))
    for (var i = 0; i < sources.length; i++) {
        assert(typeof sources[i] === "function")
    }
    assert(listener != null && typeof listener === "object")
    assert(typeof listener.send === "function")
    assert(typeof listener.error === "function")
    assert(typeof listener.warn === "function")
    assert(typeof listener.end === "function")

    // Only one source - no need to merge
    var cache = Object.create(null)
    var states = []

    for (var j = 0; j < sources.length; j++) {
        var state = {buffer: [], release: undefined}

        states.push(state)
        state.release = sources[j]({
            send: makeOnSend(state),
            end: makeOnEnd(state),
            error: onError,
            warn: listener.warn,
        })
    }

    function makeOnEnd(current) {
        return function () {
            if (states == null) return
            current.release()
            current.release = undefined
            for (var i = 0; i < states.length; i++) {
                var state = states[i]

                if (state.release == null) {
                    for (var j = 0; j < state.buffer.length; j++) {
                        listener.send(state.buffer[j])
                    }
                } else {
                    states.splice(0, i)
                    return
                }
            }

            states = undefined
            listener.end()
        }
    }

    function onError(err) {
        if (states == null) return
        for (var i = 0; i < states.length; i++) {
            var state = states[i]

            if (state.release != null) {
                state.release()
                state.release = undefined
            }
        }

        states = undefined
        listener.error(err)
    }

    function makeOnSend(s) {
        return function (file) {
            if (!hasOwn.call(cache, file)) {
                cache[file] = true

                if (s === states[0]) {
                    listener.send(file)
                } else {
                    s.buffer.push(file)
                }
            }
        }
    }
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
function streamFromPositive(negatives, positive, globOpts, listener) {
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

    // Map events from globber to the listener
    var found = !globIsSingular(globber)

    globber.on("error", listener.error)
    globber.on("match", onMatch)
    globber.on("end", onEnd)

    return function () {
        globber.removeListener("error", listener.error)
        globber.removeListener("match", onMatch)
        globber.removeListener("end", onEnd)
        globber.abort()
    }

    function onMatch(file) {
        found = true
        file = path.normalize(file)
        if (shouldInclude(negativeGlobs, file)) listener.send(file)
    }

    function onEnd() {
        if (!found) listener.warn("File not found with singular glob: " + glob)
        listener.end()
    }
}

function sortGlobs(positives, negatives, globs) {
    for (var i = 0; i < globs.length; i++) {
        var glob = globs[i]

        assert(typeof glob === "string")

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
// Returns `undefined` if no positive globs are found.
exports.create = function (globs, listener) {
    assert(Array.isArray(globs))
    assert(listener != null && typeof listener === "object")
    assert(typeof listener.send === "function")
    assert(typeof listener.error === "function")
    assert(typeof listener.warn === "function")
    assert(typeof listener.end === "function")

    var positives = []
    var negatives = []

    sortGlobs(positives, negatives, globs)

    if (positives.length === 0) {
        listener.warn("No positive glob")
        listener.end()
    } else {
        var globOpts = {
            nodir: true,
            cache: Object.create(null),
            statCache: Object.create(null),
            symlinks: Object.create(null),
            realpathCache: Object.create(null),
        }

        // Create all individual streams
        merge(positives.map(function (glob) {
            return function (listener) {
                return streamFromPositive(negatives, glob, globOpts, listener)
            }
        }), listener)
    }
}
