*[Up](../reflection.md)*

# reflect.scheduler

```js
reflect.scheduler(invoke => defer(invoke))
```

Set the async scheduler used internally by Thallium (and Bluebird, which it uses under the hood). Note that Thallium uses a fresh copy of Bluebird under the hood, so setting this won't affect your existing Bluebird installation if you use it yourself.

It mainly exists in case you're running Thallium on a platform without the normal timing constructs such as `process.nextTick` or `setTimeout`, such as Nashorn or Rhino (without ES6 support).
