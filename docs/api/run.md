*[Up](./primary.md)*

# t.run

```js
t.run(callback)
t.run().then(...)
```

This will run all your tests. If you're using the CLI, this is unnecessary, as it's handled for you, but if you're simply using a single test file, and you just want to use `node test.js`, you can use this. Also, it's good for if you're running it in the browser. It either accepts a Node-style error-first callback or returns a promise, called or resolved whenever the test is completed.

If it's rejected, the rejection always caused by one of two things:

1. A reporter threw/returned an error it didn't catch.
2. Thallium itself threw an error it didn't catch.

Either way, it's fatal, and the test has already aborted. Note that after the error, the test state *does* reset fully, so if the reporter doesn't error out a second time, the tests will run normally. Because of this, it is actually safe to rerun the tests after a rejection, since it's not in an invalid state unless the error was from Thallium itself (in which [you definitely should report it](https://github.com/isiahmeadows/thallium/issues/new)).
