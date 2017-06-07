"use strict"

var assert = require("../util").assert

/**
 * The filter is actually stored as a tree for faster lookup times when there
 * are multiple selectors. Objects can't be used for the nodes, where keys
 * represent values and values represent children, because regular expressions
 * aren't possible to use.
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

function matches(value, entry) {
    if (typeof value === "string") {
        return value === entry.name
    } else {
        return value.test(entry.name)
    }
}

function Filter(value) {
    assert(
        value == null || typeof value === "string" || value instanceof RegExp
    )

    this.value = value
    this.length = 0
}

function findEquivalent(node, entry) {
    assert(node != null && typeof node === "object")
    assert(typeof entry === "string" || entry instanceof RegExp)

    for (var i = 0; i < node.length; i++) {
        if (isEquivalent(node[i].value, entry)) return node[i]
    }

    return undefined
}

/**
 * Validate a selector at the API level.
 */
exports.validate = function (list) {
    for (var i = 0; i < list.length; i++) {
        var selector = list[i]

        if (!Array.isArray(selector)) {
            throw new TypeError("Expected selector " + i + " to be an array")
        }

        for (var j = 0; j < selector.length; j++) {
            // Strings and regular expressions are the only things allowed.
            if (typeof selector[j] !== "string" &&
                    !(selector[j] instanceof RegExp)) {
                throw new TypeError(
                    "Selector " + i + " may only consist of strings and " +
                    "regular expressions")
            }
        }
    }
}

/**
 * Create a filter from a list of selectors
 */
exports.create = function (list) {
    assert(Array.isArray(list))
    var filter = new Filter()

    for (var i = 0; i < list.length; i++) {
        var selector = list[i]
        var node = filter

        for (var j = 0; j < selector.length; j++) {
            var entry = selector[j]
            var child = findEquivalent(node, entry)

            if (child == null) {
                child = new Filter(entry)
                node[node.length++] = child
            }

            node = child
        }
    }

    return filter
}

/**
 * Test if a path matches a filter. Returns `undefined` if no match, `false` if
 * incomplete, and `true` if exact.
 */
exports.test = function (path, filter) {
    assert(Array.isArray(path))
    assert(filter != null && typeof filter === "object")

    loop: // eslint-disable-line no-labels
    for (var i = 0; i < path.length; i++) {
        var entry = path[i]

        for (var j = 0; j < filter.length; j++) {
            if (matches(filter[j].value, entry)) {
                filter = filter[j]
                continue loop // eslint-disable-line no-labels
            }
        }

        return undefined
    }

    return filter.length === 0
}
