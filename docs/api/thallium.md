*[Up](../api.md)*

# Primary API

These are the most common methods you'll ever use.

- [Block tests with `t.test(name, callback)` and `t.testSkip(name, callback)`](#block)
- [Inline tests with `t.test(name)` and `t.testSkip(name)`](#inline)
- [Async tests with `t.async(name, callback)` and `t.asyncSkip(name, callback)`](#async)
- [`t.define(assertion, callback)`](#define)
- [`t.use(...paths)`](#use)
- [`t.reporter(...reporters)`](#reporter)
- [`t.timeout(timeout)`](#timeout)
- [`t.only(only)`](#only)
- [`t.run()`](#run)
- [`t.base()`](#base)
- [`t.try()`](#try)

<a id="block"></a>
## Block tests

```js
t.test("name", callback)
t.testSkip("name", callback)
```

The basic testing method, used for defining block tests. Should be familiar to you if you have used Tape or other similar modules.

```js
// JavaScript
t.test("1 should equal 1", t => {
    t.equal(1, 1)
})
```

```coffee
# CoffeeScript
t.test '1 should equal 1', ->
    @equal 1, 1
```

This calls the callback on a separate event loop tick, with `this` and the first argument being a new Thallium instance prototypically inheriting everything of this instance, plugins, reporters, assertions, methods, and all. It is perfectly safe to add new properties and modify existing ones on the inner instance, as none of the changes escape to the outer context.

You can skip block tests with `t.testSkip("name", callback)`, which is identical except the test is reported as skipped instead.

This returns the current Thallium instance, for chaining.

<a id="inline"></a>
## Inline tests

```js
t.test("name")
t.testSkip("name")
```

Similar to `t.test("name", callback)`, but instead, it returns a new Thallium instance that you can chain assertions and other things with as a simple inline subtest.

```js
// This is nice and simple :-)
t.test("1 should equal 1").equal(1, 1)
```

It is perfectly safe to add new properties and modify existing ones on the new instance, as none of the changes escape to the outer context. Do note that the assertions' tests and [`reflect.try` callbacks](./reflect.md#try) are run when the test itself is being run, not when you define the test.

You can skip inline tests with `t.testSkip("name")`, which is identical except the test is reported as skipped instead.

<a id="async"></a>
## Async tests

```js
t.async("name", callback)
t.asyncSkip("name", callback)
```

This defines an asynchronous test. The callback can either take an extra `done` argument, return a thenable, or return an iterator of thenables and/or plain objects. Generators work as callbacks. Also, it does detect extra `done` calls and reports them accordingly.

```js
const fs = require("fs")

// Traditional callback
t.async("reads files correctly", (t, done) => {
    fs.readFile("file.txt", "utf-8", (err, data) => {
        try {
            if (err != null) throw err
            t.equal(data, "contents\n")
            return done()
        } catch (e) {
            return done(e)
        }
    })
})

// Promises
const pcall = require("promise-call")

t.async("reads files correctly", t =>
    pcall(fs.readFile, "file.txt", "utf-8")
    .then(data => t.equal(data, "contents\n")))

// Generators
t.async("reads files correctly", function *(t) {
    const data = yield pcall(fs.readFile, "file.txt", "utf-8")
    t.equal(data, "contents\n")
})

// Async functions
t.async("reads files correctly", async t => {
    const data = await pcall(fs.readFile, "file.txt", "utf-8")
    t.equal(data, "contents\n")
})
```

```coffee
# CoffeeScript
fs = require 'fs'

# Traditional callback
t.async 'reads files correctly', (_, done) ->
    fs.readFile('file.txt', 'utf-8', (err, data) =>
        try
            throw err if err?
            @equal data, 'contents\n'
            done()
        catch e
            done(e)

# Promises
pcall = require 'promise-call'

t.async 'reads files correctly', ->
    pcall(fs.readFile, 'file.txt', 'utf-8').then (data) =>
        @equal data, 'contents\n'

# Generators
t.async 'reads files correctly', ->
    data = yield pcall(fs.readFile, 'file.txt', 'utf-8')
    @equal data, 'contents\n'
```

This calls the callback on a separate event loop tick, with `this` and the first argument being a new Thallium instance prototypically inheriting everything of this instance, plugins, reporters, assertions, methods, and all. It is perfectly safe to add new properties and modify existing ones on the inner instance, as none of the changes escape to the outer context.

Do note that the test is initialized on a separate event loop tick. Also, the `done` argument is always asynchronous. And if you use the `done` callback, you *must* call it to end the test.

You can skip async tests with `t.asyncSkip("name", callback)`, which is identical except the test is reported as skipped instead.

This returns the current Thallium instance, for chaining.

<a id="define"></a>
## t.define(assertion, callback)

```js
t.define("assertion", callback)
t.define({assertion: callback})
```

Define one or more assertions on this Thallium instance. It either accepts a name and a callback or an object with name-callback pairs. Either is equivalent.

These assertions are simple functions that accept whatever arguments were passed to it, unmodified, and return an object with at least a `test` and `message` property. These may contain other properties as well, but `expected` and `actual` are treated specially.

- `test` - Whether this assertion is successful.
- `message` - A formatted message string, using this object. For example, `{actual}` inserts a formatted version of the `actual` property of the returned object into that part of the string.
- `expected` - The expected value, added to the AssertionError generated.
- `actual` - The actual value passed, added to the AssertionError generated.

As an example of its usage:

```js
// JavaScript
t.define("equal", (a, b) => {
    return {
        test: a === b,
        actual: a,
        expected: b,
        message: "Expected {actual} to equal {expected}",
    }
})

t.equal(1, 1) // Passes
t.equal(1, 2) // AssertionError: Expected 1 to equal 2
```

```coffee
# CoffeeScript
t.define 'equal', (a, b) ->
    test: a is b
    actual: a
    expected: b
    message: 'Expected {actual} to equal {expected}'

t.equal 1, 1 # Passes
t.equal 1, 2 # AssertionError: Expected 1 to equal 2
```

Errors generated from this are automatically handled by Thallium, and work just as expected in inline tests. Also, methods from this are scoped to that test and its children.

```js
// JavaScript
t.test("define", t => {
    t.define("myAssert", (a, b) => {
        return {
            test: a === b,
            actual: a,
            expected: b,
            message: "Expected {actual} to equal {expected}",
        }
    })

    t.myAssert(1, 1) // Passes
    t.test("child").myAssert(1, 1) // Passes
})

t.myAssert(1, 1) // ReferenceError: method not defined here
```

```coffee
# CoffeeScript
t.test "define", ->
    @define "myAssert", (a, b) ->
        test: a is b
        actual: a
        expected: b
        message: "Expected {actual} to equal {expected}"

    @myAssert 1, 1 # Passes
    @test("child").myAssert 1, 1 # Passes

t.myAssert 1, 1 # ReferenceError: method not defined here
```

Ad-hoc assertions are most definitely okay, and the API is made for this to be easy.

Do note that if you specify the name of any of the API methods, an error will be thrown, so you don't accidentally change things that others may depend on.

This returns the current Thallium instance, for chaining. Note that it isn't safe to call API methods within the callback.

<a id="use"></a>
## t.use(...plugins)

```js
t.use(...plugins)
```

Use one or more [plugins](../plugins.md). For memory reasons, you can't use the same plugin twice on the same test without wrapping it.

This returns the current Thallium instance, for chaining.

<a id="reporter"></a>
## t.reporter(...reporters)

Use one or more [reporters](../reporters.md).

Note that if you add a reporter to a child test, it becomes the primary set, but I plan on fixing this inconsistency.

This returns the current Thallium instance, for chaining.

<a id="timeout"></a>
## t.timeout(timeout)

```js
t.timeout(timeout)
```

Set the max timeout for a test. This is used only by `t.async()` to know how long to wait before it should fail the test. Set the timeout to `0` to inherit the parent's timeout. If the timeout is negative, it will be rounded 0.

This returns the current Thallium instance, for chaining.

<a id="only"></a>
## t.only(...paths)

```js
t.only(...paths)
```

Only run tests that are inside this path. This can be set for a parent test or even subtests. It's a lot like Mocha's `--grep` or `--fgrep`, but far more flexible. Also, only the whitelisted subtests contained in the `paths` run, and inner block/async tests aren't even initialized.

The `paths` are used as an exclusive union of tests and their children to run.

```js
t.only(["one"], ["two", "inner 1"])

t.test("one", t => {
    t.test("inner").equal(1, 1)
})

t.test("two", t => {
    t.test("inner 1").equal(0, 0)

    // Doesn't run
    t.test("inner 2").equal(0, 1)
})
```

Do note that this must be run *before* the test in question can initialize, because it changes the implementation when the test is created. If your path involves more than one part, it won't matter in practice, but it does affect things if it only contains one part.

Also, empty arrays match no test, and passing no arguments will prevent all tests from running.

<a id="run"></a>
## t.run()

```js
t.run(callback)
t.run().then(...)
```

This will run all your tests. If you're using the CLI, this is unnecessary, as it's handled for you, but if you're simply using a single test file, and you just want to use `node test.js`, you can use this. Also, it's good for if you're running it in the browser. It either accepts a Node-style error-first callback or returns a promise, called or resolved whenever the test is completed.

If it's rejected, the rejection always caused by one of two things:

1. A reporter threw/returned an error it didn't catch.
2. Thallium itself threw an error it didn't catch.

Either way, it's fatal, and the test has already aborted. Note that after the error, the test state *does* reset fully, so if the reporter doesn't error out a second time, the tests will run normally. Because of this, it is actually safe to rerun the tests after a rejection, since it's not in an invalid state unless the error was from Thallium itself (in which [you definitely should report it](https://github.com/isiahmeadows/thallium/issues/new)).

<a id="base"></a>
## reflect.base()

```js
t.base()
```

Create a new, entirely separate Thallium test instance. This is mostly used for internal testing, but it's exposed for anyone who needs it.

<a id="try"></a>
## reflect.try(func)

```js
reflect.try(func)
t.try(func)
```

These run a function when the assertions are being run, and is guaranteed to report errors thrown as within that test. This is probably mostly useful for plugin authors dealing with inline tests, for simple setup and/or cleanup within those. Note that it isn't safe to call API methods within this, though.

```js
t.test("test")
.try(() => foo.initValue())
.equal(foo.getValue(), "something")
```

Note that the callback is called with `undefined` as `this` and no arguments. The callback is *not* a plugin, and won't be treated as such.
