# Plugins

Thallium is very, *very* modular and extensible. The plugin system was made to be as easy as possible to work with, yet still be very powerful. It's powerful enough that it enables almost all the core tests to be completely black-box, while still getting all the data it needs.

Plugins are just standard functions that accept a Thallium `reflect` instance as both `this` and the only argument, and they can optionally return a value. Here's a very minimal plugin, that does absolutely nothing:

```js
module.exports = () => {};
```

You can easily wrap your tests to accept a `co` generator:

```js
// plugin.js
const co = require("co");
const toString = {}.toString;

function isGeneratorFunction(object) {
    return toString.call(object) === "[object GeneratorFunction]";
}

module.exports = reflect => ({
    test: function (name, callback) {
        if (isGeneratorFunction(callback)) callback = co.wrap(callback);
        return reflect.test(name, callback);
    },

    testSkip: function (name, callback) {
        if (isGeneratorFunction(callback)) callback = co.wrap(callback);
        return reflect.testSkip(name, callback);
    },
});
```

Or, if you'd prefer a CoffeeScript example:

```coffee
# plugin.coffee
co = require 'co'
{toString} = {}

isGeneratorFunction = (object) ->
    toString.call(object) is '[object GeneratorFunction]'

module.exports = (reflect) ->
    test: (name, callback) ->
        callback = co.wrap(callback) if isGeneratorFunction(callback)
        reflect.test name, callback

    testSkip: (name, callback) ->
        callback = co.wrap(callback) if isGeneratorFunction(callback)
        reflect.testSkip name, callback
```

Using this plugin is as simple as this:

```js
// JavaScript
const p = t.call(require("./plugin"))

p.test("test", function *() {
    const result = yield doSomethingAsync()
    assert.equal(result, "foo")
})

p.testSkip("other", function *() {
    const result = yield doSomethingElseAsync()
    assert.equal(result, "bar")
})
```

```coffee
# CoffeeScript
p = t.call require('./plugin')

p.test 'test', ->
    result = yield doSomethingAsync()
    assert.equal result, 'foo'

p.testSkip 'other', ->
    result = yield doSomethingElseAsync()
    assert.equal result, 'bar'
```

You can also easily add reporters specific to your plugin:

```js
module.exports = reflect => {
    reflect.reporter(require("my-reporter"))
}
```

## Best Practices

- When you publish plugins on npm, you should declare Thallium as a [peer dependency](https://docs.npmjs.com/files/package.json#peerdependencies). This is to ensure your users have the correct version.

- Try to minimize state within your plugins. It's often awkward to manage in general.

- If you need per-test state, use `reflect.addBeforeAll`/etc. and symbols (a polyfill is acceptable) or a WeakMap if you're not worried about broad browser support.

- Try to keep as much of your mutable global state within the plugin closure as you can, so if a user needs to load the plugin separately in multiple places, your plugin will be initialized as many times as they need. Also note that this isn't cached, so it will also be conveniently a clean slate each time.
    - Caching for repeatable operations like with persistent weak maps don't necessarily count.

- If you wrap a core method, such as in a BDD wrapper wrapping `t.test()`, try to limit how much you change the semantics in the wrapper. Otherwise, it will be very surprising to users of your plugin.

- If you don't need Thallium, don't write a plugin. For example, most assertion-related things won't need a plugin, unless they're generating tests or something like that.
