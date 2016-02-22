# API

This has a super simple core API. If you want to know about the various
assertions available here by default, please consult [here](./assertions.md).

Notes:

- The CLI is a work in progress, but it will be documented as soon as it is finished.
- `techtonic` and `techtonic/core` are completely independent from each other, but otherwise carry the same API. The only difference is that the former includes the `techtonic/assertions` plugin (i.e. the core asssertions).
- If you're using Babel, this only exports a single default export.

## Base methods

These are the methods you might appreciate knowing if you're just using the framework.

### t.test("name", callback)

The basic testing method, used for defining block tests. Should be familiar to you if you have used Tape or other similar modules.

```js
// JavaScript
t.test("1 should equal 1", function (t) {
    t.equal(1, 1)
})
```

```coffee
# CoffeeScript
t.test '1 should equal 1', ->
    @equal 1, 1
```

This calls the callback on a separate event loop tick, with `this` and the first argument being a new Techtonic instance inheriting everything of this instance, plugins, reporters, assertions, methods, and all. It is perfectly safe to add new properties and modify existing ones on the inner instance, as none of the changes escape to the outer context.

You can skip block tests with `t.testSkip("name", callback)`, which is identical except the test is reported as pending instead.

This returns the current Techtonic instance, for chaining.

### t.test("name")

Similar to `t.test("name", callback)`, but instead, it returns a new Techtonic instance that you can chain assertions and other things with as a simple inline subtest.

```js
// This is nice and simple :-)
t.test("1 should equal 1").equal(1, 1)
```

It is perfectly safe to add new properties and modify existing ones on the new instance, as none of the changes escape to the outer context.

Do note that the assertions are run on a separate event loop tick, even though the property access is all on the same one.

You can skip inline tests with `t.testSkip("name")`, which is identical except the test is reported as pending instead.

### t.async("name", callback)

This defines an asynchronous test. The callback can either take an extra `done` argument, return a thenable, or return an iterator of thenables and/or plain objects. Generators work as callbacks.

```js
var fs = require("fs")

// Traditional callback
t.async("reads files correctly", function (t, done) {
    fs.readFile("file.txt", "utf-8", function (err, data) {
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
var pcall = require("promise-call")

t.async("reads files correctly", function (t) {
    return pcall(fs.readFile, "file.txt", "utf-8").then(function (data) {
        t.equal(data, "contents\n")
    })
})

// Generators
t.async("reads files correctly", function *(t) {
    var data = yield pcall(fs.readFile, "file.txt", "utf-8")
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

This calls the callback on a separate event loop tick, with `this` and the first argument being a new Techtonic instance inheriting everything of this instance, plugins, reporters, assertions, methods, and all. It is perfectly safe to add new properties and modify existing ones on the inner instance, as none of the changes escape to the outer context.

Do note that the test is initialized on a separate event loop tick. Also, the `done` argument is always asynchronous. And if you use the `done` callback, you *must* call it to end the test.

You can skip async tests with `t.asyncSkip("name", callback)`, which is identical except the test is reported as pending instead.

This returns the current Techtonic instance, for chaining.

### t.do(func), t.block(func)

These run a function when the assertions are being run, and is guaranteed to report errors thrown as within that test. This is mostly useful for inline tests, for simple setup and/or cleanup within those (where a normal test would needlessly complicate things). `t.block()` is an ES3-compatible alias for `t.do()`.

```js
t.test("test").do(foo.initValue)
.equal(foo.getValue(), "something")
```

Note that the callback is called with `undefined` as `this` and no arguments. The callback is *not* a plugin, and won't be treated as such.

This returns the current Techtonic instance, for chaining.

## Settings-related methods

These are merely getting and/or changing settings for running the tests. All of these are scoped to their respective test (and child tests).

### t.use(...plugins)

Use one or more [plugins](./plugins.md). These can be single plugins, an array of plugins, or even multiple complex nested arrays of plugins.

This returns the current Techtonic instance, for chaining.

### t.reporter(...reporters)

Use one or more [reporters](./reporters.md). These can be single reporters, an array of reporters, or even multiple complex nested arrays of reporters.

This returns the current Techtonic instance, for chaining.

### t.reporters()

Get a list of all active reporters for this test, including this test's own reporters and all inherited ones.

### t.timeout(timeout)

Set the max timeout for a test. This is used only by `t.async()` to know how long to wait before it should fail the test. Set the timeout to `0` to inherit the parent's timeout. If the timeout is negative, it will be rounded 0.

This returns the current Techtonic instance, for chaining.

### t.timeout()

Get the currently active max timeout for a test.

### t.only(...paths)

Only run tests that are inside this path. This can be set for a parent test or even subtests. It's much like Mocha's `--grep`, but more flexible. Also, only the whitelisted tests specified in the `paths` run.

The `paths` are used as an exclusive union of tests and their children to run.

```js
t.only(["one"], ["two", "inner 1"])

t.test("one", function (t) {
    t.test("inner").equal(1, 1)
})

t.test("two", function (t) {
    t.test("inner 1").equal(0, 0)

    // Doesn't run
    t.test("inner 2").equal(0, 1)
})
```

Do note that this must be run *before* the test in question can initialize, because it changes the implementation when the test is created. If your path involves more than one part, it won't matter in practice, but it does affect things if it only contains one part.

Also, empty arrays match no test, and passing no arguments will prevent all tests from running.

## Reflective methods

Most of these are probably only interesting if you're writing [plugins](./plugins.md).

### t.define("assertion", callback), t.define(methods)

Define one or more assertions on this Techtonic instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

These assertions are simple functions that accept whatever arguments were passed to it, unmodified, and return an object with at least a `test` and `message` property. These may contain other properties as well, but `expected` and `actual` are treated specially.

- `test` - Whether this assertion is successful.
- `message` - A formatted message string, using this object. For example, `{actual}` inserts a formatted version of the `actual` property of the returned object into that part of the string.
- `expected` - The expected value, added to the AssertionError generated.
- `actual` - The actual value passed, added to the AssertionError generated.

As an example of its usage:

```js
// JavaScript
t.define("equal", function (a, b) {
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

Errors generated from this are automatically handled by Techtonic, and work just as expected in inline tests. Also, methods from this are scoped to that test and its children.

```js
// JavaScript
t.test("define", function (t) {
    t.define("myAssert", function (a, b) {
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

t.myAssert(1, 1) // Fails, method not defined here
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

t.myAssert 1, 1 # Fails, method not defined here
```

Ad-hoc assertions are most definitely permitted, and the API is made for this to be both possible and practical.

This returns the current Techtonic instance, for chaining.

### t.wrap("method", callback), t.wrap(methods)

Wrap one or more methods on this Techtonic instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the original function bound to the current instance and whatever arguments were passed to the original function, unmodified. `this` is `undefined` in the callback.

Note that this throws an error early if the method doesn't already exist.

### t.add("method", callback), t.wrap(methods)

Add one or more methods to this Techtonic instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the current instance (which is also passed as `this`) and whatever arguments were passed to the original function, unmodified.

### class t.AssertionError(message, expected, actual)

This is the base AssertionError constructor, largely derived from [`assertion-error`](http://npm.im/assertion-error), but specialized for this module. Chances are, you probably have no need of this unless you're writing a plugin, but it's exported just in case.

### t.base()

Create a new, entirely separate Techtonic test instance. This is mostly used for testing, but it's exposed for anyone who needs it. It's like an uncached `require("techtonic/core")`.

### t.parent()

Get the parent instance of this instance. If this is the base Techtonic instance (i.e. the result of `t.base()` or one of the core exports), then this will return `undefined`.

### t.checkInit()

Assert that this test is still being initialized. Unless you're writing a [plugin](./plugins.md), you probably will never need this. An equivalent is called by every core method except for the following (all pure accessors except for `t.base()`):

- `t.reporters()`
- `t.timeout()`
- `t.base()`
- `t.parent()`

This aids in [safety](./safety.md), which this framework does help.
