Notes:

- The tests in `spec/**` mirror some of the built-in tests, and *must* be updated to match the corresponding Mocha test. It's slightly inconvenient when changing things, but it works as an end-to-end test.

- The `node_modules` folder here simply mirrors some of the dependencies, and aliases this module as `thallium` within that directory. It's properly resolved by the CLI using Node's built-in `module` module to require the modules relative to the current working directory.
