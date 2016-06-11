*[Up](./primary.md)*

# t.timeout

```js
t.timeout(timeout)
```

Set the max timeout for a test. This is used only by `t.async()` to know how long to wait before it should fail the test. Set the timeout to `0` to inherit the parent's timeout. If the timeout is negative, it will be rounded 0.

This returns the current Thallium instance, for chaining.
