/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to minimize ES6 library features used.
 */

import {m} from "./messages.js"

class Node {
    constructor(value) {
        this.value = value
        this.children = []
    }

    indexOf(item) {
        let i = 0

        for (const entry of this.children) {
            if (typeof entry.value === "string" && typeof item === "string") {
                if (entry.value === item) return i
            } else if (entry.value instanceof RegExp &&
                    item instanceof RegExp) {
                if (entry.toString() === item.toString()) return i
            }
            // else, ignore different types

            i++
        }

        return -1
    }

    check(current) {
        for (let i = 0; i < this.children.length; i++) {
            const test = this.children[i]

            if (typeof test.value === "string") {
                if (current === test.value) return i
            } else if (test.value.test(current)) {
                // `test.value` is a regular expression
                return i
            }
        }

        return -1
    }
}

export class Only {
    constructor() {
        this.node = new Node(null)
    }

    add(selector) {
        let {node} = this

        for (const entry of selector) {
            // If it's not a string, make it so. This is also Symbol-proof
            if (typeof entry !== "string" && !(entry instanceof RegExp)) {
                throw new TypeError(m("type.only.path"))
            }

            const index = node.indexOf(entry)

            if (index === -1) {
                const child = new Node(entry)

                node.children.push(child)
                node = child
            } else {
                node = node.children[index]
            }
        }
    }

    // Do note that this requires the stack to be reversed. It is also mutated
    check(path) {
        let {node} = this

        // The `node != null` check is to not recurse into subtests of the
        // childmost selector.
        while (path.length && node != null) {
            const current = path.pop()
            const index = node.check(current)

            if (index === -1) return false
            node = node.children[index]
        }

        return true
    }
}
