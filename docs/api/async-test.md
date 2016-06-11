*[Up](./primary.md)*

# Async tests

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
