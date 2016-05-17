# Plugins

Thallium is very, *very* modular and extensible. The plugin system was made to be as easy as possible to work with, yet still be very powerful. It's powerful enough that the core assertions, `thallium/assertions`, are themselves implemented in a plugin.

Plugins are just standard functions that accept a Thallium test instance as both `this` and the only argument. Here's a very minimal plugin, that does absolutely nothing:

```js
module.exports = () => {}
```

You can define your own assertions within plugins pretty easily:

```js
// plugin.js
module.exports = t => {
    t.define("equal", (a, b) => ({
        test: a === b,
        actual: a,
        expected: b,
        message: "Expected {actual} to equal {expected}",
    }))

    t.define("notEqual", (a, b) => ({
        test: a !== b,
        actual: a,
        expected: b,
        message: "Expected {actual} to not equal {expected}",
    }))
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

t.test("test", t => {
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
module.exports = t => {
    t.reporter(require("my-reporter"))
}
```

## Caching

When you use a plugin, Thallium caches that per-instance. So you can't use the same plugin twice without a layer of indirection.

```js
const plugin = require("./plugin.js")

// This only calls the plugin once.
t.use(plugin)
t.use(plugin)

// This forces a new call
t.use(t => plugin.call(t, t))

t.test("test", t => {
    // This calls the plugin again, but for the child instance instead.
    t.use(plugin)
})
```

This helps cut down on memory a bit.

## Safety considerations

Any time you add a method that modifies state (Thallium's or your own) or can throw an exception during normal execution (like an assertion), you *must* call `t.checkInit()`. This ensures your method is being run *when* the current test is executing, instead of in a child test in a separate tick, for example. This check helps catch a whole class of bugs that linters can't normally catch.

If you use `t.define()`, `t.wrap()`, or `t.add()`, this is already done for you, and it's generally easiest to define your method using one of those.

Also, if your method merely queries state synchronously, you don't need to call that method.

## Other best practices

- Don't rely on Thallium's assertions when writing your own assertions. The API is simple for a reason.

- Try to minimize state within your plugins, especially that which is tied to the Thallium instance. It's often awkward to manage, and you'd be surprised how little state you actually need in practice, even without things like [Immutable.js](https://facebook.github.io/immutable-js/). If you need to assign state directly to a Thallium instance, try to use WeakMaps, Symbols, or a Symbol polyfill to avoid conflicts with other plugins. Also note that tests prototypically inherit from their parent test by design.

- Try to keep as much of your mutable global state within the plugin closure as you can, so if a user needs to load the plugin separately in multiple places, your plugin will be initialized as many times as they need.

    I may have appeared to violate this guideline with the core assertions, but the global state is effectively immutable after the plugin loads, so it's not a problem.

- If you ever have to modify a core method, such as in a BDD wrapper which would mean wrapping `t.test()` and `t.async()`, take as much care as possible to not change the API unless clearly documented as intentional. Otherwise, it will be very surprising to users of your plugin.

- If you need to add private assertions for, say, `expect`-style assertions, do document at least its existence, so plugin authors can avoid that name. And if possible, use ES6 Symbols, even if it's a polyfill.
