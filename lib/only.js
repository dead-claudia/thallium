"use strict"

var m = require("./messages")

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to maintain ES5 compatibility.
 */
var Node = {
    indexOf: function (node, item) {
        for (var i = 0; i < node.children.length; i++) {
            var entry = node.children[i].value

            if (typeof entry === "string" && typeof item === "string") {
                if (entry === item) return i
            } else if (entry instanceof RegExp && item instanceof RegExp) {
                if (entry.toString() === item.toString()) return i
            } // else, ignore different types
        }

        return -1
    },

    check: function (node, current) {
        for (var i = 0; i < node.children.length; i++) {
            var entry = node.children[i].value

            if (typeof entry === "string") {
                if (current === entry) return i
            } else if (entry.test(current)) {
                // `entry` is a regular expression
                return i
            }
        }

        return -1
    },

    create: function (value) {
        return {value: value, children: []}
    },
}

exports.create = function () {
    return {node: Node.create(null)}
}

exports.add = function (only, selector) {
    var node = only.node

    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // If it's not a string, make it so. This is also Symbol-proof
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(m("type.only.path"))
        }

        var index = Node.indexOf(node, entry)

        if (index === -1) {
            var child = Node.create(entry)

            node.children.push(node = child)
        } else {
            node = node.children[index]
        }
    }
}

// Do note that this requires the stack to be reversed. It is also mutated
exports.check = function (only, path) {
    var node = only.node

    // The non-null check is to not recurse into subtests of the childmost
    // selector.
    while (path.length && node != null) {
        var index = Node.check(node, path.pop())

        if (index === -1) return false
        node = node.children[index]
    }

    return true
}
