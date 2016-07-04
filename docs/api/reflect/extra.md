*[Up](../reflection.md)*

# reflect.extra

```js
reflect.extra(count, value, stack)
```

This creates an extra call data object. It mainly exists to test [reporters](../../reporter-api.md). `count` is the number of times, including this time, `done` was called, `value` is the value passed this time, and `stack` is the stack trace at the site of the call.
