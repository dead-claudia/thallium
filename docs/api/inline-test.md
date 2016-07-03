*[Up](./primary.md)*

# Inline tests

```js
t.test("name")
t.testSkip("name")
```

Similar to `t.test("name", callback)`, but instead, it returns a new Thallium instance that you can chain assertions and other things with as a simple inline subtest.

```js
// This is nice and simple :-)
t.test("1 should equal 1").equal(1, 1)
```

It is perfectly safe to add new properties and modify existing ones on the new instance, as none of the changes escape to the outer context. Do note that the assertions' tests and [`reflect.do` callbacks](./reflect/do.md) are run when the test itself is being run, not when you define the test.

You can skip inline tests with `t.testSkip("name")`, which is identical except the test is reported as skipped instead.
