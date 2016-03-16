# Safety

Techtonic actively enforces several invariants within it. This ensures fewer bugs in your tests, ranging from typos to type errors. Most frameworks don't do much to enforce these invariants, and some like Tape don't even enforce that test callbacks are functions or that tests are called at the right time, instead assuming you do everything right.

1. Techtonic checks types for its API. If you try to pass anything that isn't a function as a callback, Techtonic will complain. This is clearly a bug, and Techtonic will let you know this.

    ```js
    // This will throw a TypeError
    t.test("test", "implementation")
    ```

2. Techtonic ensures to the greatest of its ability that you call methods at the right time. Bugs like this one are more subtle, and are easy to miss. Tape doesn't catch these kinds of bugs, nor do many others.

    ```js
    t.test("test", function () {
        t.test("inner", function (t) {
            t.equal(1, 1)
        })
    })
    ```

3. Techtonic does check for duplicate calls to `done` in async tests. Mocha and several of the other heavyweight frameworks do this, but many of the lighter ones don't.
