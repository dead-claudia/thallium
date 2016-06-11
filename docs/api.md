# API

This has a very straightforward, intuitive core API. If you want to know about the various assertions available here by default, please see the [TypeScript definition file](../assertions.d.ts) for now, until I can get the roughly 100 or so assertions documented.

- [Primary API](./api/primary.md)
- [Reflection API](./api/reflection.md)

I would also like to note a few things, so you won't trip yourself up:

- Modifications to `thallium` don't affect `thallium/core` and vice versa, as they are two separate instances. The only difference between the two other than that is that `thallium` also includes the core assertions.

- If you're using Babel, import this as a single default export. You will run into problems otherwise.

- `t.define()` and similar can accept symbols as well as strings for method names. The property is passed through unmodified. This allows for private assertions and methods that would otherwise be awkward to create.

- `t._` is reserved for internal use, so please leave that alone.

- Don't change `t.reflect()`, because it's very important for plugin developers to get the right things.

This also catches some of the simpler dumb mistakes like forgetting to include the `t` argument in a child test, by reporting an error instead of going into an invalid state. All the state-dependent API methods check this, both in the primary and reflection APIs.

```js
// Did you catch it?
t.test("test", function () {
    t.test("inner", function (t) {
        t.equal(1, 1)
    })
})
```
