"use strict"

/**
 * The messages for everything, including the CLI.
 */

/* eslint-disable max-len */

var hasOwn = Object.prototype.hasOwnProperty

var messages = Object.freeze({
    "async.timeout": "Timeout of {0} reached",
    "fail.checkInit": "It is only safe to call test methods during initialization",
    "missing.cli.argument": "Option was passed without a required argument: {0}",
    "missing.cli.shorthand": "Shorthand option -{0} requires a value immediately after it",
    "missing.cli.loader": "Could not find loader for ext {0}. Try `npm i` if you haven't already, or `npm i --save-dev {1}`, if you aren't already using that or something else.",
    "missing.inline.body.0": "WARNING: In test: {0}",
    "missing.inline.body.1": "WARNING: inline test defined without body. Did you mean to use `t.testSkip()`?",
    "missing.inline.body.2": "WARNING: ======================================================================",
    "missing.wrap.callback": "Expected t.{0} to already be a function",
    "run.concurrent": "Can't run the same test concurrently",
    "syntax.cli.register": "Invalid syntax for --register value: {0}",
    "type.any.callback": "Expected callback to be a function",
    "type.async.callback": "Expected callback to be a function or generator",
    "type.define.callback": "Expected body of t.{0} to be a function",
    "type.define.return": "Expected result for t.{0} to be an object",
    "type.iterate.next": "Iterator next() must return an object",
    "type.iterate.throw": "Iterator throw() must return an object",
    "type.only.index": "Expected argument {0} to be an array",
    "type.only.selector": "Expected `only` path to be an array of strings or regular expressions",
    "type.plugin": "Expected plugin to be a function",
    "type.reporter": "Expected reporter to be a function",
    "type.setters.name": "Expected `name` to be a string when func exists",
    "type.callback.optional": "Expected callback to be a function or not exist",
    "type.test.name": "Expected `name` to be a string",
    "type.cli.config.thallium": "Expected config.thallium to be an object if it exists, but found a(n) {0}",
    "type.cli.config.files": "Expected config.files to be a string or array if it exists, but found a(n) {0}",
    "type.cli.config.files.entry": "Expected config.files[{0}] to be a string, but found a(n) {1}",
    "type.reporter.argument": "Options cannot be a report. Did you forget to call the reporter first?",
})

/* eslint-enable max-len */

// This expands templates with {0} -> args[0], {1} -> args[1], etc.
module.exports = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    if (!hasOwn.call(messages, name)) {
        throw new RangeError("Unknown message name: " + name)
    }

    return messages[name].replace(/\{(\d+)\}/g, function (_, i) {
        return args[i]
    })
}
