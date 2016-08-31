Notes:

- The tests in `spec/**` mirror some of the built-in tests, and *must* be updated to match the corresponding Mocha test. It's slightly flaky, but it works as an end-to-end test.

- The `node_modules` folder here simply mirrors some of the dependencies, and aliases this module as `thallium` within that directory. It's properly resolved by the CLI using [`resolve`](http://npm.im/resolve), to resolve the `require` path relative to the config module.
