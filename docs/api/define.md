*[Up](./primary.md)*

# t.define

```js
t.define("assertion", callback)
t.define({assertion: callback})
```

Define one or more assertions on this Thallium instance. It either accepts a name and a callback or an object with name-callback pairs. Either is equivalent.

These assertions are simple functions that accept whatever arguments were passed to it, unmodified, and return an object with at least a `test` and `message` property. These may contain other properties as well, but `expected` and `actual` are treated specially.

- `test` - Whether this assertion is successful.
- `message` - A formatted message string, using this object. For example, `{actual}` inserts a formatted version of the `actual` property of the returned object into that part of the string.
- `expected` - The expected value, added to the AssertionError generated.
- `actual` - The actual value passed, added to the AssertionError generated.

As an example of its usage:

```js
// JavaScript
t.define("equal", (a, b) => {
    return {
        test: a === b,
        actual: a,
        expected: b,
        message: "Expected {actual} to equal {expected}",
    }
})

t.equal(1, 1) // Passes
t.equal(1, 2) // AssertionError: Expected 1 to equal 2
```

```coffee
# CoffeeScript
t.define 'equal', (a, b) ->
    test: a is b
    actual: a
    expected: b
    message: 'Expected {actual} to equal {expected}'

t.equal 1, 1 # Passes
t.equal 1, 2 # AssertionError: Expected 1 to equal 2
```

Errors generated from this are automatically handled by Thallium, and work just as expected in inline tests. Also, methods from this are scoped to that test and its children.

```js
// JavaScript
t.test("define", t => {
    t.define("myAssert", (a, b) => {
        return {
            test: a === b,
            actual: a,
            expected: b,
            message: "Expected {actual} to equal {expected}",
        }
    })

    t.myAssert(1, 1) // Passes
    t.test("child").myAssert(1, 1) // Passes
})

t.myAssert(1, 1) // ReferenceError: method not defined here
```

```coffee
# CoffeeScript
t.test "define", ->
    @define "myAssert", (a, b) ->
        test: a is b
        actual: a
        expected: b
        message: "Expected {actual} to equal {expected}"

    @myAssert 1, 1 # Passes
    @test("child").myAssert 1, 1 # Passes

t.myAssert 1, 1 # ReferenceError: method not defined here
```

Ad-hoc assertions are most definitely okay, and the API is made for this to be easy.

Do note that if you specify the name of any of the API methods, an error will be thrown, so you don't accidentally change things that others may depend on.

This returns the current Thallium instance, for chaining. Note that it isn't safe to call API methods within the callback.
