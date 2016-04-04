"use strict"

var m = require("./messages")

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to maintain ES5 compatibility.
 */

function createNode(value) {
    return {value: value, children: []}
}

function isEquivalent(entry, item) {
    if (typeof entry === "string" && typeof item === "string") {
        return entry === item
    } else if (entry instanceof RegExp && item instanceof RegExp) {
        return entry.toString() === item.toString()
    } else {
        return false
    }
}

function nodeIndexOf(node, item) {
    for (var i = 0; i < node.children.length; i++) {
        if (isEquivalent(node.children[i].value, item)) return i
    }

    return -1
}

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        // `entry` is a regular expression
        return entry.test(item)
    }
}

function nodeCheck(node, current) {
    for (var i = 0; i < node.children.length; i++) {
        if (matches(node.children[i].value, current)) return i
    }

    return -1
}

exports.create = function () {
    return {node: createNode(null)}
}

function addSingle(node, entry) {
    // If it's not a string, make it so. This is also Symbol-proof
    if (typeof entry !== "string" && !(entry instanceof RegExp)) {
        throw new TypeError(m("type.only.path"))
    }

    var index = nodeIndexOf(node, entry)

    if (index !== -1) return node.children[index]

    var child = createNode(entry)

    node.children.push(child)
    return child
}

exports.add = function (only, selector) {
    var node = only.node

    for (var i = 0; i < selector.length; i++) {
        node = addSingle(node, selector[i])
    }
}

// Do note that this requires the stack to be reversed. It is also mutated.
exports.check = function (only, path) {
    var node = only.node

    // The non-null check is to not recurse into subtests of the childmost
    // selector.
    while (path.length && node != null) {
        var index = nodeCheck(node, path.pop())

        if (index === -1) return false
        node = node.children[index]
    }

    return true
}
