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
let AssertionError

try {
    /* eslint-disable no-new-func */

    AssertionError = new Function(`
        "use strict"
        class AssertionError extends Error {
            constructor(message, expected, actual) {
                super(message)

                this.expected = expected
                this.actual = actual
            }

            get name() {
                return "AssertionError"
            }

            toJSON(includeStack) {
                return {
                    name: this.name,
                    message: this.message,
                    expected: this.expected,
                    actual: this.actual,
                    stack: includeStack ? this.stack : undefined,
                }
            }
        }

        // Test that native subclasses are actually *supported*. Some engines
        // with incomplete ES6 support will fail here.
        new AssertionError("test", true, false)

        return AssertionError
    `)()

    /* eslint-enable no-new-func */
} catch (e) {
    /* eslint-disable func-style */
    AssertionError = /** @this */ function (message, expected, actual) {
        /* eslint-enable func-style */
        this.message = message
        this.expected = expected
        this.actual = actual

        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, AssertionError)
        } else {
            const e = new Error(message)

            e.name = this.name
            this.stack = e.stack
        }
    }

    const desc = value => ({
        configurable: true,
        enumerable: false,
        writable: true,
        value,
    })

    AssertionError.prototype = Object.create(Error.prototype, {
        constructor: desc(AssertionError),
        name: desc("AssertionError"),
        toJSON: desc(/** @this */ function (includeStack) {
            return {
                name: this.name,
                message: this.message,
                expected: this.expected,
                actual: this.actual,
                stack: includeStack ? this.stack : undefined,
            }
        }),
    })
}

export default AssertionError
