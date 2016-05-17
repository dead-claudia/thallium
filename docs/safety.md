# Safety

Thallium actively enforces several invariants within it. This ensures fewer bugs in your tests, ranging from typos to type errors. It's better to catch mistakes early and report them sensibly than to allow internal invariants to be broken and have confusing error messages with a potentially useless stack trace.

1. Thallium checks types for its API. If you try to pass anything that isn't a function as a callback, Thallium will complain. This below is clearly a bug, and Thallium will let you know this.

    ```js
    // This will throw a TypeError
    t.test("test", "do something")
    ```

    It shouldn't be surprising for most users, though.

2. Thallium ensures to the greatest of its ability that you call methods at the right time. Bugs like this one are more subtle, and are easy to miss. Tape and similar don't usually catch these kinds of bugs, and heavier frameworks like Mocha just use globals normally, so this doesn't exist.

    ```js
    // Did you catch it?
    t.test("test", function () {
        t.test("inner", function (t) {
            t.equal(1, 1)
        })
    })
    ```

3. Thallium does check for duplicate calls to `done` in async tests. Mocha and several of the other heavy frameworks do this, but many of the lighter ones don't.
