*[Up](../api.md)*

# Other APIs

There are a few other APIs that are a little more low-level, but still useful.

- [`internal.root()`](#internal-root)
- [`internal.reports`](#internal-reports)
- [`internal.hookErrors`](#internal-hookerrors)
- [`internal.location(name, index)`](#internal-location)

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
