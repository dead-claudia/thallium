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
    getPath: function (path) {
        if (path === this.lastPath) {
            return this.lastTree
        }

        this.lastPath = path

        var tree = this // eslint-disable-line consistent-this

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                tree = tree.children[entry.index] = new Tree(entry.name)
            }
        }

        return this.lastTree = tree
    },
})
