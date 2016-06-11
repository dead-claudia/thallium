*[Up](../reflection.md)*

# reflect.define

```js
reflect.define("assertion", callback)
reflect.define({assertion: callback})
```

This is pretty much the same as calling [`t.define`](../define.md) with the same arguments, but if `t.define()` was changed at any point, this will always work like it's supposed to. Also, this returns `undefined`, so it's unsuitable for chaining.
