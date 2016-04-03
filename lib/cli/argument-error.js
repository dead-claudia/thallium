"use strict"

var error = require("../util/error.js")

module.exports = error.createError(
"'use strict';" +
"class ArgumentError extends Error {" +
"    get name() {" +
"        return 'ArgumentError';" +
"    }" +
"}" +
// Test that native subclasses are actually *supported*. Some engines
// with incomplete ES6 support will fail here.
"new ArgumentError('message')" +
"return ArgumentError", {
    constructor: function ArgumentError(message) {
        this.message = message
        error.recordStack(this)
    },
    name: "ArgumentError",
})
