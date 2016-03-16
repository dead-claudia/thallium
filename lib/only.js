"use strict"

var methods = require("./util/methods.js")
var m = require("./messages.js")

function Node(value) {
    this.value = value
    this.children = []
}

methods(Node, {
    indexOf: function (item) {
        for (var i = 0; i < this.children.length; i++) {
            var entry = this.children[i]

            if (typeof entry.value === "string" && typeof item === "string") {
                if (entry.value === item) return i
            } else if (entry.value instanceof RegExp &&
                    item instanceof RegExp) {
                if (entry.toString() === item.toString()) return i
            }
        }

        return -1
    },

    check: function (current) {
        for (var i = 0; i < this.children.length; i++) {
            var test = this.children[i]

            if (typeof test.value === "string") {
                if (current === test.value) return i
            } else if (test.value.test(current)) {
                // `test.value` is a regular expression
                return i
            }
        }

        return -1
    },
})

module.exports = Only
function Only() {
    this.node = new Node(null)
}

methods(Only, {
    add: function (selector) {
        var node = this.node

        for (var i = 0; i < selector.length; i++) {
            var entry = selector[i]

            // If it's not a string, make it so. This is also Symbol-proof
            if (typeof entry !== "string" && !(entry instanceof RegExp)) {
                throw new TypeError(m("type.only.path"))
            }

            var index = node.indexOf(entry)

            if (index === -1) {
                var child = new Node(entry)

                node.children.push(child)
                node = child
            } else {
                node = node.childen[index]
            }
        }
    },

    // Do note that this requires the stack to be reversed. It is also mutated
    check: function (path) {
        var node = this.node

        // Cover subtests of the `only` path
        while (path.length && node != null) {
            var current = path.pop()
            var index = node.check(current)

            if (index === -1) return false
            node = node.children[index]
        }

        return true
    },
})
