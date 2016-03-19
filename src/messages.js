/**
 * The messages for everything (CLI + tests)
 */

const messages = {
    /* eslint-disable max-len */

    "async.timeout": "Timeout of {0} reached",
    "missing.cli.reporter.close": "--reporter subargs must have closing bracket",
    "missing.cli.reporter.open": "--reporter subargs must have opening bracket",
    "fail.checkInit": "It is only safe to call test methods during initialization",
    "missing.cli.argument": "Option was passed without a required argument: {0}",
    "missing.cli.reporter.module": "--reporter subargs must have a module",
    "missing.cli.shorthand.value": "Shorthand option -{0} requires a value immediately after it",
    "missing.wrap.callback": "Expected t.{0} to already be a function",
    "only.cli.reporter.syntax": "Argument syntax can only be used with the --reporter option",
    "run.concurrent": "Can't run the same test concurrently",
    "type.any.callback": "Expected callback to be a function",
    "type.async.callback": "Expected callback to be a function or generator",
    "type.cli.subarg.key": "Invalid name for subarg: {0}",
    "type.define.callback": "Expected body of t.{0} to be a function",
    "type.define.return": "Expected result for t.{0} to be an object",
    "type.iterate.next": "Iterator next() must return an object",
    "type.iterate.throw": "Iterator throw() must return an object",
    "type.only.index": "Expected argument {0} to be an array",
    "type.only.path": "Expected the `only` path to contain only strings or regular expressions",
    "type.plugin": "Expected plugin to be a function",
    "type.reporter": "Expected reporter to be a function",
    "type.setters.name": "name must be a string if func exists",
    "type.callback.optional": "Expected callback to be a function or not exist",
    "type.test.name": "Expected name to be a string",

    /* eslint-enable max-len */
}

// This expands templates with {0} -> args[0], {1} -> args[1], etc.
export default function m(name, ...args) {
    const message = messages[name]

    if (message == null) {
        throw new RangeError(`message \`${name}\` does not exist!`)
    }

    return message.replace(/\{(\d+)\}/, (_, index) => args[index])
}
