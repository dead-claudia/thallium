"use strict"

var methods = require("./methods.js")

var hasOwn = {}.hasOwnProperty

module.exports = Only
function Only() {
    this.only = Object.create(null)
}

methods(Only, {
    add: function (selector) {
        var only = this.only

        for (var j = 0; j < selector.length; j++) {
            if (only[j] == null) only[selector[j]] = Object.create(null)
            only = only[selector[j]]
        }
    },

    // Do note that this requires the stack to be reversed. It is also mutated
    check: function (path) {
        var only = this.only

        // Cover subtests of the `only` path
        while (path.length && only != null) {
            var current = path.pop()
            if (!hasOwn.call(only, current)) {
                return false
            }
            only = only[current]
        }
        return true
    },
})
