# Techtonic

[![Build Status](https://travis-ci.org/isiahmeadows/techtonic.svg?branch=master)](https://travis-ci.org/isiahmeadows/techtonic) [![Join the chat at https://gitter.im/isiahmeadows/techtonic](https://badges.gitter.im/isiahmeadows/techtonic.svg)](https://gitter.im/isiahmeadows/techtonic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 0.10 and later, and browser support is also planned.

*Note that this is a huge work in progress.*

## Installation

```
npm install --save-dev techtonic
```

## Usage

This is waiting on the completion of the CLI, but for now, you can look at the
[documentation](./docs/README.md) and [tests](./test/), which use Techtonic's
assertions themselves.

Couple specific notes:

1. You can use the framework without the built-in assertions. Just require `techtonic/core`, and implement your own assertions. Matter of fact, the built-in ones are actually their own plugin.

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

## Remaining work

1. Finish + test the CLI. It's still a work in progress.
2. Create basic reporters for TAP, spec, dot, etc.
3. Finish documenting this project. This mainly includes the core assertions and CLI.
4. Self-host this module's tests like what Mocha does.
5. Bring this back to pure ES5. It's easier to prototype in ES6, but it's easier to maintain compatibility in ES5.
6. Port this to the browser with Browserify/Webpack. This will include implementing Node's `util.inspect` for the browser, while actually testing it, unlike [`util-inspect`, the most common replacement](https://www.npmjs.com/package/util-inspect), which is completely untested.
7. Write a few plugins for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, etc.
8. Write lots of blog posts. :smile:

## Contributing

General information:

- [Bluebird](http://bluebirdjs.com) is used extensively as the Promise implementation.
- The source code is in `lib/**`.
- The executables are in `bin/**`, but they won't work. Most of the CLI code is in `lib/cli/**`.
- The documentation and examples are in `docs/**`.
- The tests are in `test/**`.
    - Mocha is currently used as the runner.
    - The assertions are fully self-hosted. Using Techtonic to test Techtonic is awesome!
    - Fixtures for those tests are in `test-fixtures/**`.
    - Utilities are in `test-util/**`.
- This uses [eslint-config-isiahmeadows](https://npmjs.com/package/eslint-config-isiahmeadows) for its presets (specifically `isiahmeadows/node-4`). In case you're curious what those settings are, you can start with [the index file](https://github.com/isiahmeadows/eslint-config-isiahmeadows/blob/master/index.js), which the rest are only minor variations of.

Tips and idioms:

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

- Classes are used, but inheritance is avoided. Generally, the question I ask myself is "Is this like a getter or setter, or is it mostly logic?", and usually, I go method in the first case, and function for the latter. Most of the exceptions are in the test types themselves, where I extracted many common methods into their own module to keep the base class simple.

- Note that outside of the tests, the `Techtonic` class, and Error subclasses, inheritance is minimal.

## License

ISC, unless otherwise stated.
