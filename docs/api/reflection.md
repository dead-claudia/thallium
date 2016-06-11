*[Up](../api.md)*

# Reflection API

Most of these are probably only interesting if you're writing [plugins](./plugins.md). They permit some more low-level introspection of individual tests, and make it easier to do some of the other things you need to do.

You can use `t.reflect()` to get a Reflect instance for access into the various introspection APIs.

- [`reflect.define`](./reflect/define.md)
- [`reflect.do`](./reflect/do.md)
- [`reflect.wrap`](./reflect/wrap.md)
- [`reflect.add`](./reflect/add.md)
- [`reflect.AssertionError` Class](./reflect/assertion-error.md)
- [`reflect.base`](./reflect/base.md)
- [`reflect.parent`](./reflect/parent.md)
- [`reflect.methods`](./reflect/methods.md)
- [`reflect.runnable`](./reflect/runnable.md)
- [`reflect.skipped`](./reflect/skipped.md)
- [`reflect.root`](./reflect/root.md)
- [`reflect.inline`](./reflect/inline.md)
- [`reflect.async`](./reflect/async.md)
- [`reflect.checkInit`](./reflect/check-init.md)
- [`reflect.reporters`](./reflect/reporters.md)
- [`reflect.activeReporters`](./reflect/active-reporters.md)
- [`reflect.timeout`](./reflect/timeout.md)
- [`reflect.activeTimeout`](./reflect/active-timeout.md)
