# Contributing

Did you run into issues? Great! Tell me [here](http://github.com/isiahmeadows/thallium/issues/new) and I'll see how I can help you.

Do you want to contribute code? Keep reading below.

## General information

This tries to support the following platforms:

- Node 0.10 all the way to the latest stable release (version 6.x at the time of writing). I'm aware that Node 0.10 and 0.12 are unsupported, but it's not hard to maintain compatibility with the way this is structured, so I'm doing it anyways.
- For browser support, consult the `testling.browsers` field in the [`package.json`](https://github.com/isiahmeadows/thallium/blob/master/package.json).

This is written in pure ES5, and there isn't much of an option to support ES6. Some features still need polyfilled for browsers, and the way this is written doesn't really need many ES6 features.

- There is a class-ish helper [here](http://github.com/isiahmeadows/thallium/blob/master/lib/methods.js) used throughout.

- I used a function to fill the same role as a generator, with identical boilerplate.

- I have found an easy C++-like idiom to address ES6 collections similarly to for-of loops:

    ```js
    var iter = coll.values()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        var value = next.value
        // do things...
    }
    ```

I use [Bluebird](http://bluebirdjs.com) extensively for promises, as it makes code much easier to handle. It provides many features not present in ES6, and it is far faster.

## Code organization

- `bin/` - The executables used. Note that the directory isn't used as the raw binary directory, but it's aliased from the `package.json`.

- `r` - This is the home of all reporters. Nothing goes here except for reporter modules part of the public API.

- `lib/` - Most of the source code for this project. Many of the modules part of the public API are merely thin wrappers pointing to some place here, including the main export.

- `lib/cli` - This contains 90% of the logic for the CLI. Dependency injection is heavily used for testing.

- `lib/reporter` - This contains common logic for the reporters.

- `docs` - The documentation for this project, 100% Markdown.

- `docs/examples` - This contains several examples of various things.

- `test` - This contains all the tests, and generally mirrors `lib` in its file structure. Mocha is currently used as the test runner, and the assertions are fully self-hosted. Using Thallium to test Thallium is awesome!

- `test-fixtures` - This contains the fixtures for the various tests.
    - Some of the `test` files are mirrored in [CoffeeScript](http://coffeescript.org/) within `test-fixtures/acceptance/large-coffee` to help aid in more real-world usage. These are very explicitly and clearly labeled, so it should be very hard to miss.

- `test-util` - This contains various test-related utilities, including the mocks. Here's a few in `test-util/base.js` you might appreciate knowing about:

    - `push(array)` - A Thallium reporter that accepts an array destination to push its reports into.
    - `n(type, path, value)` - Create a reporter node of a given type, path, and value.
    - `p(name, index)` - Create a path node with a given name and index

    These are most frequently used for testing reporter output for whatever reason.

## Code style

- This is linted with ESLint, and uses my [`isiahmeadows/node` preset](https://npmjs.com/package/eslint-config-isiahmeadows) for the main code base and `isiahmeadows/es6` for the examples.
- [CoffeeLint](http://www.coffeelint.org/) is used to lint the few CoffeeScript files littered around, mostly there for testing and examples.
- Classes are used, but inheritance is limited. They are usually used for grouping functionality and unnesting functions, but functions are usually preferred for callbacks and one-off things that don't involve delaying execution.
- File names are lower cased, and namespaces are capitalized like constructors, except for ones imported from Node builtins and ones treated as values.
- `exports.foo = bar` is preferred over `module.exports.foo = bar`.

## Tips and idioms

- If you're on Linux and have [`nvm`](https://github.com/creationix/nvm) installed, there's a little `test.sh` script you can run, which will test everything Travis sees on your local machine, installing them if necessary. Note that it doesn't actually update existing installations for you, though. It's not quite *that* magical.

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage to simplify your testing. They are very well tested, and if any of the assertions or plugin/reporter APIs break, you'll know it immediately. For example, I used a combination of `t.reporter` and `t.match` to test the reporter output throughout the tests. Here's an example from one of the tests:

    ```js
    const tt = t.base()
    const ret = []

    tt.reporter(Util.push(ret))

    tt.test("test", () => {})
    tt.test("test", () => {})

    return tt.run().then(() => {
        t.match(ret, [
            n("start", [])
            n("start", [p("test", 0)])
            n("end", [p("test", 0)])
            n("pass", [p("test", 0)])
            n("start", [p("test", 1)])
            n("end", [p("test", 1)])
            n("pass", [p("test", 1)])
            n("end", [])
            n("exit", [])
        ])
    })
    ```
