# Plugins

Techtonic is very, *very* modular and extensible. The plugin system was made to
be as easy as possible to work with, yet still be very powerful. It's powerful
enough that the core assertions, `techtonic/assertions`, are themselves a
plugin.

Plugins are just standard functions that accept a Techtonic test instance as
both `this` and the only argument. Here's a very minimal plugin, that does
absolutely nothing:

```js
module.exports = function () {}
```

You can define your own assertions within plugins pretty easily:

```js
// plugin.js
module.exports = function (t) {
    t.define("equal", function (a, b) {
        return {
            test: a === b,
            actual: a,
            expected: b,
            message: "Expected {actual} to equal {expected}",
        }
    })

    t.define("notEqual", function (a, b) {
        return {
            test: a !== b,
            actual: a,
            expected: b,
            message: "Expected {actual} to not equal {expected}",
        }
    })
}
```

Or, if you'd prefer a CoffeeScript example:

```coffee
# plugin.coffee
module.exports = ->
    @define
        equal: (a, b) ->
            test: a is b
            actual: a
            expected: b
            message: 'Expected {actual} to equal {expected}'

        notEqual: (a, b) ->
            test: a isnt b
            actual: a
            expected: b
            message: 'Expected {actual} to not equal {expected}'
```

The built-in assertions are themselves a Techtonic plugin, although their
assertions use a handful of internal DSLs to concisely define about 100 unique
assertions.

Using this plugin is as simple as this:

```js
// JavaScript
t.use(require("./plugin.js"))

t.test("test", function (t) {
    t.equal(1, 1)
    t.notEqual(1, 0)
})
```

```coffee
# CoffeeScript
t.use require('./plugin.js')

t.test 'test', ->
    @equal 1, 1
    @notEqual 1, 0
```

You can also easily add reporters specific to your plugin:

```js
module.exports = function (t) {
    t.reporter(require("my-reporter"))
}
```

## Caching

When you use a plugin, Techtonic caches that per-instance. So you can't use the
same plugin twice without a layer of indirection.

```js
var plugin = require("./plugin.js")

// This only calls the plugin once.
t.use(plugin)
t.use(plugin)

// This forces an uncached load
t.use(function (t) { plugin.call(t, t) })

t.test("test", function (t) {
    // This calls the plugin again, but for this particular instance instead.
    t.use(plugin)
})
```

This both cuts down on memory and acts as a safety feature.

## Safety considerations

Any time you add a method that modifies state (Techtonic's or your own) or can
throw an exception during normal execution (like an assertion), you *must* call
`t.checkInit()`. This ensures that your method is being run *when* the current
test is executing, instead of in a child test in a separate tick, for example.
This check eliminates a whole class of bugs that linters can't normally catch.

If you use `t.define()`, `t.wrap()`, or `t.add()`, this is already done for you.
