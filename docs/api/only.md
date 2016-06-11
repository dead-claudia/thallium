*[Up](./primary.md)*

# t.only

```js
t.only(...paths)
```

Only run tests that are inside this path. This can be set for a parent test or even subtests. It's a lot like Mocha's `--grep` or `--fgrep`, but far more flexible. Also, only the whitelisted subtests contained in the `paths` run, and inner block/async tests aren't even initialized.

The `paths` are used as an exclusive union of tests and their children to run.

```js
t.only(["one"], ["two", "inner 1"])

t.test("one", t => {
    t.test("inner").equal(1, 1)
})

t.test("two", t => {
    t.test("inner 1").equal(0, 0)

    // Doesn't run
    t.test("inner 2").equal(0, 1)
})
```

Do note that this must be run *before* the test in question can initialize, because it changes the implementation when the test is created. If your path involves more than one part, it won't matter in practice, but it does affect things if it only contains one part.

Also, empty arrays match no test, and passing no arguments will prevent all tests from running.
