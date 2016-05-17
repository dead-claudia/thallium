"use strict"

const hasOwn = Object.prototype.hasOwnProperty
const PASSING = 1
const FAILING = 2

module.exports = class Tree {
    constructor(value) {
        this.value = value
        this.status = 0
        this.children = Object.create(null)
        this.lastTree = null
    }

    static get PASSING() { return PASSING }
    static get FAILING() { return FAILING }

    getPath(path) {
        if (path === this.lastPath) {
            return this.lastTree
        }

        this.lastPath = path

        let tree = this // eslint-disable-line consistent-this

        for (const entry of path) {
            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                tree = tree.children[entry.index] = new Tree(entry.name)
            }
        }

        return this.lastTree = tree
    }
}
