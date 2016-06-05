# API

This has a super simple core API. If you want to know about the various
assertions available here by default, please consult [here](./assertions.md).

Notes:

- The CLI is a work in progress, but it will be documented as soon as it is finished.
- `thallium` and `thallium/core` are completely independent from each other, but otherwise carry the same API. The only difference is that the former includes the `thallium/assertions` plugin (i.e. the core asssertions).
- If you're using Babel, this only exports a single default export.
- `t.define()`, `t.wrap()`, `t.add()`, etc. can accept Symbols as well as strings. The property is passed through unmodified. This allows for private assertions.
- `t._` and `reflect._` are reserved for internal use, so please leave those alone.
- Don't change `reflect` on the current instance, as it's very important for plugin developers. `add`, `wrap`, and `define` all throw errors if it's accessed, anyways.

This also catches some of the simpler dumb mistakes like forgetting to include the `t` argument in a child test, by reporting an error instead of going into an invalid state. All the state-dependent API methods check this, both in the primary and reflection APIs.

```js
// Did you catch it?
t.test("test", function () {
    t.test("inner", function (t) {
        t.equal(1, 1)
    })
})
```

## Primary API

These are the most common methods you'll ever use.

### t.test("name", callback), t.testSkip("name", callback)

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

### t.test("name"), t.testSkip("name")

Similar to `t.test("name", callback)`, but instead, it returns a new Thallium instance that you can chain assertions and other things with as a simple inline subtest.

```js
// This is nice and simple :-)
t.test("1 should equal 1").equal(1, 1)
```

It is perfectly safe to add new properties and modify existing ones on the new instance, as none of the changes escape to the outer context.

Do note that the assertions are run on a separate event loop tick, even though the property access is all on the same one.

You can skip inline tests with `t.testSkip("name")`, which is identical except the test is reported as skipped instead.

### t.async("name", callback), t.asyncSkip("name", callback)

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

### t.define("assertion", callback), t.define({assertion: callback})

Define one or more assertions on this Thallium instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

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

### t.use(...plugins)

Use one or more [plugins](./plugins.md). For memory reasons, you can't use the same plugin twice on the same test without wrapping it.

This returns the current Thallium instance, for chaining.

### t.reporter(...reporters)

Use one or more [reporters](./reporters.md).

Note that if you add a reporter to a child test, it becomes the primary set, but I plan on fixing this inconsistency.

This returns the current Thallium instance, for chaining.

### t.timeout(timeout)

Set the max timeout for a test. This is used only by `t.async()` to know how long to wait before it should fail the test. Set the timeout to `0` to inherit the parent's timeout. If the timeout is negative, it will be rounded 0.

This returns the current Thallium instance, for chaining.

### t.only(...paths)

Only run tests that are inside this path. This can be set for a parent test or even subtests. It's much like Mocha's `--grep`, but more flexible. Also, only the whitelisted tests specified in the `paths` run.

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

## Reflection

Most of these are probably only interesting if you're writing [plugins](./plugins.md). They permit some more low-level introspection of individual tests, and make it easier to do some of the other things you need to do.

### t.reflect()

Get a Reflect instance for access into the various introspection APIs.

### reflect.define("assertion", callback), reflect.define({assertion: callback})

This has the same effect as calling `t.define()` with the same arguments, although if `t.define()` was changed at any point, this will always point to the original, so it carries stronger guarantees. Also, this returns `undefined` instead of the current instance.

### reflect.do(func)

These run a function when the assertions are being run, and is guaranteed to report errors thrown as within that test. This is probably mostly useful for plugin authors dealing with inline tests, for simple setup and/or cleanup within those. Note that it isn't safe to call API methods within this, though.

```js
t.test("test")
.do(foo.initValue)
.equal(foo.getValue(), "something")
```

Note that the callback is called with `undefined` as `this` and no arguments. The callback is *not* a plugin, and won't be treated as such.

### reflect.wrap("method", callback), reflect.wrap({method: callback})

Wrap one or more existing methods on this Thallium instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the original function bound to the current instance and whatever arguments were passed to the original function, unmodified. `this` is the current instance in the callback.

Note that this throws an error early if the method doesn't already exist, or if it's either `reflect` or `_`.

### reflect.add("method", callback), reflect.add({method: callback})

Add one or more methods to this Thallium instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the current instance (which is also passed as `this`) followed by whatever arguments were passed to the original function, unmodified.

Note that this throws an error early if the method already exists (even if it's inherited), or if it's either `reflect` or `_`.

### class reflect.AssertionError(message, expected, actual)

This is a reference to the base AssertionError constructor, largely derived from [`assertion-error`](http://npm.im/assertion-error), but specialized for this module.

### reflect.base()

Create a new, entirely separate Thallium test instance. This is mostly used for testing, but it's exposed for anyone who needs it. It's like an uncached `require("thallium/core")`.

### reflect.parent()

Get the parent instance of this instance. If this is the base Thallium instance (i.e. the result of `reflect.base()` or one of the core exports), then this will return `undefined`.

### reflect.methods()

Get the associated methods of this instance, as in where the reflect instance came from.

### reflect.runnable()

Check if this is a runnable test (i.e. not blacklisted by `t.only()` or skipped).

### reflect.skipped()

Check if this is a skipped test (i.e. defined by `t.testSkip("test")`, etc.).

### reflect.root()

Check if this is a root test. This is true at the global scope and for any result of `reflect.base()`, but false elsewhere.

### reflect.inline()

Check if this is an inline test (i.e. defined as `t.test("test").equal(1, 1)`).

### reflect.async()

Check if this is an async test (i.e. defined as `t.async("test", callback)`).

### reflect.checkInit()

Assert that this test is currently being initialized. If you are doing an operation that is affected by test state, you *must* check this so your users don't get surprised by their tests accidentally getting in an invalid state. If you're using `reflect.add()` or `reflect.define()`/`t.define()`, this is already done for you, so you probably won't be calling this directly very often.

### reflect.reporters()

Get a list of all own reporters, or an empty list if there were none.

### reflect.activeReporters()

Get the currently active reporter list.

### reflect.timeout()

Get the own timeout, or 0 if it's inherited or `Infinity` if it was disabled.

### reflect.activeReporters()

Get the currently active timeout, or the framework default of 2000 ms.
