*[Up](../reflection.md)*

# reflect.do

```js
reflect.do(func)
```

These run a function when the assertions are being run, and is guaranteed to report errors thrown as within that test. This is probably mostly useful for plugin authors dealing with inline tests, for simple setup and/or cleanup within those. Note that it isn't safe to call API methods within this, though.

```js
t.test("test")
.do(() => foo.initValue())
.equal(foo.getValue(), "something")
```

Note that the callback is called with `undefined` as `this` and no arguments. The callback is *not* a plugin, and won't be treated as such.
