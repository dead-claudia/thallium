"use strict"

var m = require("../messages.js")

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use.
 */

function isEquivalent(entry, item) {
    if (typeof entry === "string" && typeof item === "string") {
        return entry === item
    } else if (entry instanceof RegExp && item instanceof RegExp) {
        return entry.toString() === item.toString()
    } else {
        return false
    }
}

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        return entry.test(item)
    }
}

exports.Only = Only
function Only(value) {
    this.value = value
    this.children = []
}

var found = false

function find(comparator, node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (comparator(child.value, entry)) {
            found = true
            return child
        }
    }

    found = false
    return undefined
}

exports.add = function (node, selector) {
    if (!Array.isArray(selector)) {
        throw new TypeError(m("type.only.selector"))
    }

    var current = node

    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // Strings are the only things allowed.
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(m("type.only.selector"))
        }

        var child = find(isEquivalent, current, entry)

        if (!found) {
            child = new Only(entry)
            current.children.push(child)
        }

        current = child
    }
}

// Do note that this accepts a reversed stack which is itself mutated.
exports.check = function (node, path) {
    var current = node

    for (var i = path.length; i !== 0;) {
        current = find(matches, current, path[--i])
        if (!found) return false
    }

    return true
}
