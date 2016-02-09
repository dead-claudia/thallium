"use strict"

try {
    // If it's an ES6 engine, let's use a native subclass. If it isn't, or the
    // `Function` constructor is blocked because of CSP, there is a graceful
    // fallback.
    /* eslint-disable no-new-func */
    module.exports = new Function(
        "'use strict'\n" +
        "class AssertionError extends Error {\n" +
        "    constructor(message, expected, actual) {\n" +
        "        super(message)\n" +
        "\n" +
        "        this.expected = expected\n" +
        "        this.actual = actual\n" +
        "    }\n" +
        "\n" +
        "    get name() {\n" +
        "        return 'AssertionError'\n" +
        "    }\n" +
        "\n" +
        "    toJSON(includeStack) {\n" +
        "        return {\n" +
        "            name: this.name,\n" +
        "            message: this.message,\n" +
        "            expected: this.expected,\n" +
        "            actual: this.actual,\n" +
        "            stack: includeStack ? this.stack : undefined,\n" +
        "        }\n" +
        "    }\n" +
        "}\n" +
        // Test that native subclasses are actually *supported*. Some engines
        // with incomplete ES6 support will fail here.
        "new AssertionError('test', true, false)\n" +
        "return AssertionError"
    )()
    /* eslint-enable no-new-func */
} catch (e) {
    module.exports = (function () {
        function AssertionError(message, expected, actual) {
            this.message = message
            this.expected = expected
            this.actual = actual

            if (typeof Error.captureStackTrace === "function") {
                Error.captureStackTrace(this, AssertionError)
            } else {
                var e = new Error(message)
                e.name = this.name
                this.stack = e.stack
            }
        }

        AssertionError.prototype = Object.create(Error.prototype)
        AssertionError.prototype.constructor = AssertionError
        AssertionError.prototype.name = "AssertionError"

        AssertionError.prototype.toJSON = function (includeStack) {
            return {
                name: this.name,
                message: this.message,
                expected: this.expected,
                actual: this.actual,
                stack: includeStack ? this.stack : undefined,
            }
        }

        return AssertionError
    })()
}
