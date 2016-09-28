*[Up](../api.md)*

# Reflection API

Most of these are probably only interesting if you're writing [plugins](./plugins.md). They permit some more low-level introspection of individual tests, and make it easier to do some of the other things you need to do.

You can use `t.reflect()` to get a Reflect instance for access into the various introspection APIs.

- [`reflect.activeReporters()`](#activereporters)
- [`reflect.activeTimeout()`](#activetimeout)
- [`reflect.add(method, callback)`](#add)
- [`class reflect.AssertionError`](#assertion-error)
- [`reflect.async()`](#async)
- [`reflect.checkInit`](#checkinit)
- [`reflect.define(assertion, callback)`](#define)
- [`reflect.try(func)`](#try)
- [`reflect.extra(count, value, stack)`](#extracount)
- [`reflect.inline()`](#inline)
- [`reflect.loc(name, index)`](#loc)
- [`reflect.methods()`](#methods)
- [`reflect.parent()`](#parent)
- [`reflect.report(type, path, value, duration, slow)`](#report)
- [`reflect.reporters()`](#reporters)
- [`reflect.root()`](#root)
- [`reflect.runnable()`](#runnable)
- [`reflect.scheduler(defer)`](#scheduler)
- [`reflect.skipped()`](#skipped)
- [`reflect.timeout()`](#timeout)
- [`reflect.wrap(method, callback)`](#wrap)

<a id="activereporters"></a>
## reflect.activeReporters()

```js
reflect.activeReporters()
```

Get the currently active reporter list.

<a id="activetimeout"></a>
## reflect.activeTimeout()

```js
reflect.activeTimeout()
```

Get the currently active timeout, or the framework default of 2000 ms.

<a id="add"></a>
## reflect.add(method, callback)

```js
reflect.add("method", callback)
reflect.add({method: callback})
```

Add one or more methods to this Thallium instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the instance it was called from (which is also passed as `this`) followed by whatever arguments were passed to the original function, unmodified.

Note that this throws an error early if the method already exists (even if it's inherited), or if it's either `reflect` or `_`.

<a id="assertion-error"></a>
## class reflect.AssertionError

```js
new reflect.AssertionError(message, expected, actual)
```

This is a reference to the base AssertionError constructor, largely derived from [`assertion-error`](http://npm.im/assertion-error), but specialized for this module. Unlike that version, this does not have any special `toJSON` method.

<a id="async"></a>
## reflect.async()

```js
reflect.async()
```

Check if this is an async test (i.e. defined as `t.async("test", callback)`).

<a id="checkinit"></a>
## reflect.checkInit()

```js
reflect.checkInit()
```

Assert that this test is currently being initialized. If you are doing an operation that is affected by test state, you *must* check this so your users don't get surprised by their tests accidentally getting in an invalid state. If you're using [`reflect.add`](#add) or [`reflect.define`](#define)/[`t.define`](./thallium.md#define), this is already done for you, so you probably won't be calling this directly very often.

<a id="define"></a>
# reflect.define(assertion, callback)

```js
reflect.define("assertion", callback)
reflect.define({assertion: callback})
```

This is pretty much the same as calling [`t.define`](./thallium.md#define) with the same arguments, but if `t.define()` was changed at any point, this will always work like it's supposed to. Also, this returns `undefined`, so it's unsuitable for chaining.

<a id="try"></a>
## reflect.try(func)

```js
reflect.try(func)
```

These run a function when the assertions are being run, and is guaranteed to report errors thrown as within that test. This is probably mostly useful for plugin authors dealing with inline tests, for simple setup and/or cleanup within those. Note that it isn't safe to call API methods within this, though.

```js
t.test("test")
.try(() => foo.initValue())
.equal(foo.getValue(), "something")
```

Note that the callback is called with `undefined` as `this` and no arguments. The callback is *not* a plugin, and won't be treated as such.

<a id="extra"></a>
## reflect.extra(count, value, stack)

```js
reflect.extra(count, value, stack)
```

This creates an extra call data object. It mainly exists to test [reporters](./reporter-api.md). `count` is the number of times, including this time, `done` was called, `value` is the value passed this time, and `stack` is the stack trace at the site of the call.


<a id="inline"></a>
## reflect.inline()

```js
reflect.inline()
```

Check if this is an inline test (i.e. defined as `t.test("test").equal(1, 1)`).


<a id="loc"></a>
## reflect.loc(name, index)

```js
reflect.loc(name, index)
```

This creates a raw location. It mainly exists to test [reporters](./reporter-api.md). `name` is the name of the test the location points to, and `index` is the index of that location.

<a id="methods"></a>
## reflect.methods()

```js
reflect.methods()
```

Get the associated methods of this instance, as in where the reflect instance came from.

<a id="parent"></a>
## reflect.parent()

```js
reflect.parent()
```

Get the parent instance of this instance. If this is the base Thallium instance (i.e. the result of [`t.base()`](./thallium.md#base) or Thallium's main export), then this will return `undefined`.

<a id="report"></a>
## reflect.report(type, path, value, duration, slow)

```js
reflect.report(type, path, value, duration, slow)
```

This creates a raw report. It mainly exists to test [reporters](./reporter-api.md).

<a id="reporters"></a>
## reflect.reporters()

```js
reflect.reporters()
```

Get a list of all own reporters, or an empty list if there were none.

<a id="root"></a>
## reflect.root()

```js
reflect.root()
```

Check if this is a root test. This is true at the global scope and for any result of `t.base()`, but false elsewhere.

<a id="runnable"></a>
## reflect.runnable()

```js
reflect.runnable()
```

Check if this is a runnable test (i.e. not blacklisted by `t.only()` or skipped).

<a id="scheduler"></a>
## reflect.scheduler(defer)

```js
reflect.scheduler(invoke => defer(invoke))
```

Set the async scheduler used internally by Thallium (and Bluebird, which it uses under the hood). Note that Thallium uses a fresh copy of Bluebird under the hood, so setting this won't affect your existing Bluebird installation if you use it yourself.

It mainly exists in case you're running Thallium on a platform without the normal timing constructs such as `process.nextTick` or `setTimeout`, such as Nashorn or Rhino (without ES6 support).

<a id="skipped"></a>
## reflect.skipped()

```js
reflect.skipped()
```

Check if this is a skipped test (i.e. defined by `t.testSkip("test")`, etc.).

<a id="timeout"></a>
## reflect.timeout()

```js
reflect.timeout()
```

Get the own timeout, or 0 if it's inherited or `Infinity` if it was disabled.

<a id="wrap"></a>
## reflect.wrap(method, callback)

```js
reflect.wrap("method", callback)
reflect.wrap({method: callback})
```

Wrap one or more existing methods on this Thallium instance. It either accepts a name and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the original function bound to the current instance and whatever arguments were passed to the original function, unmodified. `this` in the callback is the instance the wrapped method was called on.

Note that this throws an error early if the method doesn't already exist, or if it's either `reflect` or `_`.
