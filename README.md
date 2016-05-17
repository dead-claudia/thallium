# Thallium

[![Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 4 and later, and browser support + legacy Node is also planned.

*Note that this is a huge work in progress.*

## Installation

```
npm install --save-dev thallium
```

## Usage

This is waiting on the completion of the CLI, but for now, you can look at the [documentation](./docs/README.md) and [tests](./test/), which use Thallium's assertions themselves.

Couple specific notes:

1. You can use the framework without the built-in assertions. Just require `thallium/core`, and implement your own assertions. Matter of fact, the built-in ones are actually their own plugin.

2. Any test properties you define in your tests are scoped per-test. These include assertions. Example:

    ```js
    t.test("test", t => {
        t.foo = 1
        t.hasOwn(t, "foo")

        t.test("inner", t => {
            t.hasOwn(t, "foo")
        })

        const tt = t.test("inner 2")

        tt.hasOwn(tt, "foo")
    })

    t.notHasOwn(t, "foo")
    ```

## API

See the [documentation](./docs/README.md).

## Roadmap

1. Set up [AppVeyor](https://www.appveyor.com/) to run tests on Windows. Currently, it's only actively tested on Linux.
2. Create basic reporters for TAP, spec, dot, etc.
3. Finish documenting this project. This mainly includes the core assertions and CLI.
4. Bring this back to pure ES5 to test in older versions of Node. It's easier to prototype in ES6, but many browsers and runtimes don't support that.
5. Port this to the browser via Browserify/Webpack.
    - I'll also rewrite [`util-inspect`](https://www.npmjs.com/package/util-inspect) based on Node's [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options) after finishing the port, since that module is completely untested, and has no understanding of ES6. :worried:
6. Write a few plugins for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, REPL friendliness\*, etc.
7. Write lots of blog posts.\*\* :smile:

\* *That's something from Lisp-land I really wish was here...*

\*\* *And port this to Python, when I can find time.*

## Contributing

General information:

- This is written partially in ES6, up to what Node 4 supports.
    - Arrow functions, `let`/`const` declarations, and classes exist.
    - Destructuring and rest parameters don't.
- [Bluebird](http://bluebirdjs.com) is used extensively as the Promise implementation.
- The source code is in `lib/**`.
- The executables are in `bin/**`. Most of the CLI code is in `lib/cli/**`.
- The documentation and examples are in `docs/**`.
- The tests are in `test/**`.
    - Mocha is currently used as the runner.
    - The assertions are fully self-hosted. Using Thallium to test Thallium is awesome!
    - Fixtures for those tests are in `test-fixtures/**`.
    - Utilities are in `test-util/**`.
    - Some of the test files are mirrored in [CoffeeScript](http://coffeescript.org/) and JavaScript for the acceptance tests. These are very explicitly labeled, so it should be fairly obvious.
- This uses [eslint-config-isiahmeadows](https://npmjs.com/package/eslint-config-isiahmeadows) for its presets (specifically `isiahmeadows/node-4`). In case you're curious what those settings are, you can start with [the index file](https://github.com/isiahmeadows/eslint-config-isiahmeadows/blob/master/index.js), which the rest are only minor variations of.
- For the few CoffeeScript files littered around, this uses [CoffeeLint](http://www.coffeelint.org/) to lint them. They exist for testing and examples.

Tips and idioms:

- If you're on Linux, and have [`nvm`](https://github.com/creationix/nvm) installed, there's a little `test.sh` script you can run, which will test everything Travis sees on your local machine, installing them if necessary. Note that it doesn't actually update them for your, though. It's not quite *that* magical.

- Classes are used, but inheritance is limited. I also prefer functions over instance methods unless they're something that should be overridable, are more like properties, or are exposed in the API.

    As an exception, classes are usually preferred over closures, to limit nesting and group functionality.

- There are a few useful helpers in `test-util/base.js`, that you may appreciate when you write your tests:

    - `push(array) -> plugin` - A plugin that accepts an array destination argument, and stores its reports in it.
    - `n(type, path, value) -> reporterNode` - Create a reporter node of a given type, path, and value.
    - `p(name, index) -> pathNode` - Create a path node with a given name and index

    These are most frequently used for testing reporter output for whatever reason.

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage to simplify your testing. They are very well tested. For example, I used a combination of `t.reporter` and `t.deepEqual` to test the reporter output throughout the tests. Here's an example from one of the tests:

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

## License

ISC, unless otherwise stated.
