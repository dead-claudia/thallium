"use strict"

var methods = require("../methods.js")

var hasOwn = Object.prototype.hasOwnProperty

module.exports = Tree

function Tree(value) {
    this.value = value
    this.status = 0
    this.children = Object.create(null)
    this.lastTree = null
}

Tree.PASSING = 1
Tree.FAILING = 2

methods(Tree, {
    _isRepeat: function (path) {
        // Can't be a repeat the first time.
        if (this.lastPath == null) {
            return false
        }

        if (path === this.lastPath) {
            return true
        }

        if (path.length !== this.lastPath.length) {
            return false
        }

        // It's an easy enough heuristic to check because it's unlikely the
        // nesting will be consistently more than a few levels deep (>= 5)
        for (var j = 0; j < path.length; j++) {
            if (path[j] !== this.lastPath[j]) {
                return false
            }
        }

        this.lastPath = path
        return true
    },

    hasPath: function (path) {
        if (this._isRepeat(path)) {
            return true
        }

        var tree = this // eslint-disable-line consistent-this

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                return false
            }
        }

        return true
    },

    getPath: function (path) {
        if (this._isRepeat(path)) {
            return this.lastTree
        }

        var tree = this // eslint-disable-line consistent-this

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                tree = tree.children[entry.index] = new Tree(entry.name)
            }
        }

        this.lastPath = path
        return this.lastTree = tree
    },
})
