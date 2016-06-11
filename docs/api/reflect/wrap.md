*[Up](../reflection.md)*

# reflect.wrap("method", callback), reflect.wrap({method: callback})

```js
reflect.wrap("method", callback)
reflect.wrap({method: callback})
```

Wrap one or more existing methods on this Thallium instance. It either accepts a name and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the original function bound to the current instance and whatever arguments were passed to the original function, unmodified. `this` in the callback is the instance the wrapped method was called on.

Note that this throws an error early if the method doesn't already exist, or if it's either `reflect` or `_`.
