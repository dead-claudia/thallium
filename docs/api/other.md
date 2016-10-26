*[Up](../api.md)*

# Other APIs

There are a few other APIs that are a little more low-level, but still useful.

- [`match.match(a, b)`](#match-match)
- [`match.strict(a, b)`](#match-strict)
- [`internal.root()`](#internal-root)
- [`internal.reports`](#internal-reports)
- [`internal.hookErrors`](#internal-hookerrors)
- [`internal.location(name, index)`](#internal-location)

<a id="match-match"></a>
## match.match(a, b)

```js
match.match(a, b)
```

Compare two values, either primitives or objects, structurally without regard to their prototypes. Note that this does still do some type checking:

- Primitives and their wrapper objects do not match
- Symbols are checked for their description, not for identity
- Dates are matched through their values
- Arrays don't match plain objects or `arguments`
- Typed arrays don't match anything other than another array of the same type
- Maps and sets have their contents compared in an order-independent fashion
- It checks typed arrays, Buffers, ArrayBuffers and DataViews
- Expando properties aren't checked on arrays/maps/sets/etc.
- It works with the core-js Symbol polyfill if it's the global, and they are checked just like the native primitives
- It ignores the `stack` property on Errors
- Objects that are specially handled (e.g. Dates, arrays, `arguments`, Errors) are checked to have the same prototype.

<a id="match-strict"></a>
## match.strict(a, b)

```js
match.strict(a, b)
```

Compare two values, either primitives or objects, structurally, but also verify that their prototypes match (and their children, recursively). The above notes for `match.match` also apply, except that symbols are checked for identity instead

<a id="internal-root"></a>
## internal.root()

```js
internal.root()
```

Create a fresh new Thallium instance. Just in case you need a whole fresh new instance for some reason.

<a id="internal-reports"></a>
## internal.reports

```js
internal.reports.start()
internal.reports.enter(path, duration=10, slow=75)
internal.reports.leave(path)
internal.reports.pass(path, duration=10, slow=75)
internal.reports.fail(path, error, duration=10, slow=75)
internal.reports.skip(path)
internal.reports.end()
internal.reports.error(error)
internal.reports.hook(path, hookError)
```

A namespace of report factories. The name of the factory corresponds with the type of report.

- `path` is the path to the test, given as an array of locations.
- `error` is the error thrown.
- `duration` is the duration of the test, defaulting to 10.
- `slow` is the duration of the test, defaulting to 75.
- `hookError` for hook reports is a hook error wrapper representing what was thrown from the hook report.

<a id="internal-hookerrors"></a>
## internal.hookErrors

```js
internal.hookErrors.beforeAll(func, error)
internal.hookErrors.beforeEach(func, error)
internal.hookErrors.afterEach(func, error)
internal.hookErrors.afterAll(func, error)
```

A namespace of hook error factories. The name of the factory corresponds with the type of hook error.

- `func` is the callback used.
- `error` is the error thrown.

<a id="internal-location"></a>
## internal.location(name, index)

```js
internal.location(name, index)
```

Create a location object. This is for the `path` argument to the various `internal.reports` factories.
