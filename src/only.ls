'use strict'

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to minimize ES6 library features used.
 */
require! './messages': {m}

class Node
    (@value) -> @children = []

    indexOf: (item) ->
        for entry, i in @children
            if typeof entry.value == "string" && typeof item == "string"
                return i if entry.value == item
            else if entry.value instanceof RegExp and item instanceof RegExp
                return i if entry.toString! == item.toString!
            # else, ignore different types
        -1

    check: (current) ->
        for test, i in @children
            if typeof test.value == "string"
                return i if current == test.value
            else if test.value.test current
                # `test.value` is a regular expression
                return i
        -1

export class Only
    -> @node = new Node null

    add: (selector) ->
        node = @node

        for entry in selector
            # If it's not a string, make it so. This is also Symbol-proof
            if typeof entry != "string" and entry not instanceof RegExp
                throw new TypeError m "type.only.path"

            index = node.indexOf entry

            node = if index == -1
                node.children.push child = new Node entry
                child
            else
                node.children[index]

    # Do note that this requires the stack to be reversed. It is also mutated
    check: (path) ->
        node = @node

        # The non-null check is to not recurse into subtests of the childmost
        # selector.
        while path.length and node?
            index = node.check path.pop!
            return false if index == -1
            node = node.children[index]

        true
