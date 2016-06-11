*[Up](./primary.md)*

# Block tests

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
