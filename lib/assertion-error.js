"use strict"

var error = require("./util/error.js")

/**
 * The assertion error implementation for this framework. The first half is an
 * initial attempt to use an ES6 Error subclass, but it will throw if it's not
 * properly supported or if CSP is enabled (an unlikely scenario for testing).
 *
 * The second half, the fallback, is very heavily adapted from assertion-error,
 * but with the arguments changed and simplified to my use case.
 *
 * Both versions are roughly equivalent, other than that the first one carries
 * the ES6 constraints on methods, etc.
 */

module.exports = error.createError(
"'use strict';" +
"class AssertionError extends Error {" +
"    constructor(message, expected, actual) {" +
"        super(message);" +
"        this.expected = expected;" +
"        this.actual = actual;" +
"    }" +
"" +
"    get name() {" +
"        return 'AssertionError';" +
"    }" +
"" +
"    toJSON(includeStack) {" +
"        return {" +
"            name: this.name," +
"            message: this.message," +
"            expected: this.expected," +
"            actual: this.actual," +
"            stack: includeStack ? this.stack : undefined," +
"        };" +
"    }" +
"}" +
// Test that native subclasses are actually *supported*. Some engines
// with incomplete ES6 support will fail here.
"new AssertionError('test', true, false)" +
"return AssertionError", {
    constructor: function AssertionError(message, expected, actual) {
        this.message = message
        this.expected = expected
        this.actual = actual
        error.recordStack(this)
    },

    name: "AssertionError",

    toJSON: function (includeStack) {
        return {
            name: this.name,
            message: this.message,
            expected: this.expected,
            actual: this.actual,
            stack: includeStack ? this.stack : undefined,
        }
    },
})
