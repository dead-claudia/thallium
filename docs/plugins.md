# Plugins

Techtonic is very, *very* modular and extensible. The plugin system was made to be as easy as possible to work with, yet still be very powerful. It's powerful enough that the core assertions, `techtonic/assertions`, are themselves implemented in a plugin.

Plugins are just standard functions that accept a Techtonic test instance as both `this` and the only argument. Here's a very minimal plugin, that does absolutely nothing:

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
t.use require('./plugin.coffee')

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

When you use a plugin, Techtonic caches that per-instance. So you can't use the same plugin twice without a layer of indirection.

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

Any time you add a method that modifies state (Techtonic's or your own) or can throw an exception during normal execution (like an assertion), you *must* call `t.checkInit()`. This ensures that your method is being run *when* the current test is executing, instead of in a child test in a separate tick, for example. This check eliminates a whole class of bugs that linters can't normally catch.

If you use `t.define()`, `t.wrap()`, or `t.add()`, this is already done for you.

## Other best practices

- Don't rely on Techtonic's assertions when writing your own assertions.

- Avoid adding state directly to the Techtonic instance yourself. Your plugin, and possibly others as well, can easily conflict if you do this. If possible, prefer WeakMaps or Symbols for assigning state, as those can't conflict.

    Also note that tests prototypically inherit from their parent test by design.

- Closure state inside plugins is in essence global state. Consider putting any necessary global state there, not in the actual global scope, so consumers can expect loading the plugin on two separate tests results in instantiating the global state twice, each one unique to that particular test (and its children).

    As an exception, if your global state is immutable and independent of any test-specific state, it's okay to pull it out, as I did with the core assertions. I may have appeared to violate the previous guideline, but this is why it's okay.

- Don't modify core methods unless you absolutely have to (e.g. a BDD wrapper might require wrapping `t.test()` and `t.async()`). And if you ever have to, take as much care as possible to maintain the core API contracts, so other plugins don't break.

- If you need to add private assertions for, say, a BDD `expect`-style assertion wrapper, do document at least its existence, so users can avoid related conflicts with other assertion plugins. And do take care to minimize these private assertions.

    Also, if you can depend on ES6 symbols, use that for your assertion name.
