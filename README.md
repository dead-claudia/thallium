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
2. Finish documenting this project. This mainly includes the core assertions and CLI.
3. Implement Node's `util.inspect` for the browser, while actually testing it.
    - [`util-inspect`, the most common version](https://www.npmjs.com/package/util-inspect), is completely untested.
    - Probably best to bring Node's implementation + tests over, and adapt that accordingly.
3. Self-host this module's tests like what Mocha does.
4. Port this to the browser with Browserify/Webpack.
5. Write a few plugins for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, etc.
6. Write lots of blog posts. :smile:

## Contributing

General information:

- [Bluebird](http://bluebirdjs.com) is used extensively as the Promise implementation.
- The source code is in `lib/**`.
- The executables are in `bin/**`, but they won't work. Most of the CLI code is in `lib/cli/**`.
- The documentation and examples are in `docs/**`.
- The tests are in `test/**`.
    - Mocha is used to run the tests, and the assertions are self-hosted.
    - Fixtures for those tests are in `test-fixtures/**`.
    - Utilities are in `test-util/**`.
- This uses [eslint-config-isiahmeadows](https://npmjs.com/package/eslint-config-isiahmeadows) for its presets. In case you're curious what those settings are, you can start with [the index file](https://github.com/isiahmeadows/eslint-config-isiahmeadows/blob/master/index.js), which the rest are only minor variations of.

Tips and idioms:

- There are a few useful helpers in `test-util/base.js`, that you may appreciate when you write your tests:

    - `fixture(name) -> directory` - Get a fixture's path from `test-fixtures/**`.
    - `push(array) -> plugin` - A plugin that accepts an array destination argument, and stores its reports in it.
    - `n(type, path, value) -> reporterNode` - Create a reporter node of a given type, path, and value.
    - `p(name, index) -> pathNode` - Create a path node with a given name and index

    These are most frequently used for testing reporter output for whatever reason.

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage to simplify your testing. For example, I used a combination of `t.reporter` and `t.deepEqual` to test the reporter output throughout the tests. Here's an example from one of the tests:

    ```js
    var tt = t.base()
    var ret = []

    tt.reporter(util.push(ret))

    tt.test("test", function () {})
    tt.test("test", function () {})

    return tt.run().then(function () {
        t.deepEqual(ret, [
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

- Plain object factories are preferred for ADTs, and external functions are used for the logic. If you need dynamic dispatch, make it a direct member of that object (this was done for `init` and `run` for the test types). It's somewhat C-like/functional (take your pick) in that regard.

- Note that outside of handling the API methods and Error subclasses, almost no inheritance at all is used.

## License

ISC, unless otherwise stated.
