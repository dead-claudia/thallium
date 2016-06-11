*[Up](../reflection.md)*

# reflect.add("method", callback), reflect.add({method: callback})

Add one or more methods to this Thallium instance. It either accepts a string `name` and a callback or an object with various methods. Either style is equivalent.

When the method is called, the callback is called with the instance it was called from (which is also passed as `this`) followed by whatever arguments were passed to the original function, unmodified.

Note that this throws an error early if the method already exists (even if it's inherited), or if it's either `reflect` or `_`.
