*[Up](../api.md)*

# Reflection API

Most of these are probably only interesting if you're writing [plugins](./plugins.md). They permit some more low-level introspection of individual tests, and make it easier to do some of the other things you need to do.

This is what's passed into the callback of `t.call(plugin)`.

Also note that `reflect` instances are persistent and tied to the backing test instance. What does this mean? It means as long as you access the same backing test, you get the same `reflect` instance. And because subtests are cleared after running, previous `reflect` instances won't carry over to the next `t.run()`.

- [`reflect.current`](#current)
- [`reflect.count`](#count)
- [`reflect.children`](#children)
- [`reflect.root`](#root)
- [`reflect.isRoot`](#isroot)
- [`reflect.isLocked`](#islocked)
- [`reflect.ownTimeout`](#owntimeout)
- [`reflect.timeout`](#timeout)
- [`reflect.ownSlow`](#ownslow)
- [`reflect.slow`](#slow)
- [`reflect` test hooks](#test-hooks)
- [Tests with `reflect.test("name", callback)` and `reflect.testSkip("name", callback)`](#tests)
- [Reporter management with `reflect.reporter(reporter, arg)` and `reflect.removeReporter(reporter)`](#reporters)
- [`reflect.name`](#name)
- [`reflect.index`](#index)
- [`reflect.parent`](#parent)

<a id="current"></a>
## reflect.current

```js
reflect.current // getter
```

Get the currently initializing test. If nothing is running, this is the root, but if you're currently in a child test, this is a `reflect` for that child test.

<a id="count"></a>
## reflect.count

```js
reflect.count // getter
```

Get the current number of child tests for this test.

<a id="children"></a>
## reflect.children

```js
reflect.children // getter
```

Get the list of `reflect` instances for this test's children.

<a id="root"></a>
## reflect.root

```js
reflect.root // getter
```

Get the `reflect` instance for the root test.

<a id="isroot"></a>
## reflect.isRoot

```js
reflect.isRoot // getter
```

Whether or not this is the root test.

<a id="islocked"></a>
## reflect.isLocked

```js
reflect.isLocked // getter
```

Whether or not this test is locked (i.e. unsafe to modify). Modification includes adding tests and before/after hooks, and those methods will throw when this test is locked.

<a id="owntimeout"></a>
## reflect.ownTimeout

```js
reflect.ownTimeout // getter
```

Get the own timeout, `0` if it's inherited, or `Infinity` if it was disabled.

<a id="timeout"></a>
## reflect.timeout

```js
reflect.timeout // getter
```

Get the currently active timeout, or the framework default of 2000 ms.

<a id="ownslow"></a>
## reflect.ownSlow

```js
reflect.ownSlow // getter
```

Get the own slow threshold, `0` if it's inherited, or `Infinity` if it was disabled.

<a id="slow"></a>
## reflect.slow

```js
reflect.slow // getter
```

Get the currently active slow threshold, or the framework default of 2000 ms.

<a id="test-hooks"></a>
## Reflect test hooks

```js
// Add
reflect.before(func)
reflect.beforeAll(func)
reflect.after(func)
reflect.afterAll(func)

// Remove
reflect.removeBefore(func)
reflect.removeBeforeAll(func)
reflect.removeAfter(func)
reflect.removeAfterAll(func)
```

Schedule a callback to run on every test. They work [exactly like the main API methods do](./thallium.md#test-hooks), just you can also remove them with the second variants.

<a id="tests"></a>
## Tests

```
t.test("name", callback)
t.testSkip("name", callback)
```

Just like [how you would normally define tests](./thallium.md#tests), you can also add tests via plugins, in case you want to create a test wrapper. This might be useful for, say, a wrapper that enables you to define tests with `co` generator bodies.

```js
"use strict"

const t = require("thallium");
const assert = require("thallium/assert");
const co = require("co");
const myModule = require("./index.js");

// Create your wrapper
const test = t.call(reflect => (name, body) => {
    if ({}.toString.call(body) === "[object GeneratorFunction]") {
        return reflect.test(name, co.wrap(body));
    } else {
        return reflect.test(name, body);
    }
});

// And have some async fun!
function asyncComputation() {
    return new Promise(resolve => {
        setTimeout(() => resolve(myModule.value), 10)
    });
}

test("testing", function *() {
    test("things work", function *() {
        const myValue = yield asyncComputation()
        const yourValue = "string";

        assert.equal(myValue, yourValue);
    });
});
```

<a id="reporters"></a>
## Reporter management

```js
reflect.reporter(reporter, arg=undefined)
reflect.removeReporter(reporter)
```

Add or remove a [reporter](../reporters.md), with an optional `arg` to pass to it. Note that this only exists on the root `reflect`, and not any children.

<a id="name"></a>
## reflect.name

```js
reflect.name // getter
```

Get the test's name. This getter does not exist on the root `reflect`.

<a id="index"></a>
## reflect.index

```js
reflect.index // getter
```

Get the test's index. This getter does not exist on the root `reflect`.

<a id="parent"></a>
## reflect.parent

```js
reflect.parent // getter
```

Get the test's parent. This getter does not exist on the root `reflect`.
