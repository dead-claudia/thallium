"use strict"

var Status = require("./status.js")
var hasOwn = Object.prototype.hasOwnProperty

exports.Tree = function (value) {
    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

/**
 * This helps speed up getting previous trees, so a potentially expensive
 * tree search doesn't have to be performed.
 *
 * (This does actually make a slight perf difference in the tests.)
 */
function isRepeat(cache, path) {
    // Can't be a repeat the first time.
    if (cache.path == null) return false
    if (path === cache.path) return true
    if (path.length !== cache.path.length) return false

    // It's unlikely the nesting will be consistently more than a few levels
    // deep (>= 5), so this shouldn't bog anything down.
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== cache.path[i]) {
            return false
        }
    }

    cache.path = path
    return true
}

exports.getPath = function (r, path) {
    if (isRepeat(r.cache, path)) {
        return r.cache.result
    }

    var child = r.base

    for (var i = 0; i < path.length; i++) {
        var entry = path[i]

        if (hasOwn.call(child.children, entry.index)) {
            child = child.children[entry.index]
        } else {
            child = child.children[entry.index] = new r.Tree(entry.name)
        }
    }

    return r.cache.result = child
}
