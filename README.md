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
3. Fix + test `src/util/inspect.js`. It was copied initially from util-inspect, but that was literally untested.
    - Probably best to bring Node's implementation + tests over, and adapt that accordingly.
3. Self-host this module's tests like what Mocha does.
4. Port this to the browser with Browserify/Webpack.
    - Note that global variable detection should be disabled for this library itself. That's handled already by this as well as every single one of its runtime dependencies outside the CLI.
5. Write a few plugins for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, etc.
6. Write lots of blog posts. :smile:

## Contributing

General information:

- Everything is in ES6 using Babel to transpile everything.
- [Bluebird](http://bluebirdjs.com) is used extensively as the Promise implementation.
- The source code is in `src/**`.
- The executables are in `bin/**`, but they are currently broken, as the CLI itself is a work in progress.
    - The main library code is in `src/cli/**`. If you're contributing to the CLI, this is probably where your patch will be.
- The documentation and examples are in `docs/**`.
- The tests are in `test/**`.
    - Mocha is used to run the tests, and the assertions are self-hosted.
    - Fixtures for those tests are in `test-fixtures/**`.
    - Utilities are in `test-util/**`.
- The compiled output is in `lib/**`. Do note that this isn't checked into Git.
- This uses [eslint-config-isiahmeadows](https://npmjs.com/package/eslint-config-isiahmeadows) for its presets. In case you're curious what those settings are, you can start with [the index file](https://github.com/isiahmeadows/eslint-config-isiahmeadows/blob/master/index.js), which the rest are only minor variations of.

Tips and idioms:

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage. For example, I used a combination of `t.reporter()` and `t.deepEqual` to test the reporter output throughout the tests. Here's an example from one of the tests:

    ```js
    const tt = t.base()
    const ret = []

    tt.reporter(push(ret))

    tt.test("test", () => {})
    tt.test("test", () => {})

    return tt.run().then(() => {
        t.deepEqual(ret, [
            n("start", []),
            n("start", [p("test", 0)]),
            n("end", [p("test", 0)]),
            n("pass", [p("test", 0)]),
            n("start", [p("test", 1)]),
            n("end", [p("test", 1)]),
            n("pass", [p("test", 1)]),
            n("end", []),
            n("exit", []),
        ])
    })
    ```

- Classes are used throughout, but only to describe ADTs and non-trivial state. For simpler cases, I prefer plain objects, sometimes created by a factory if the same structure is used multiple times, and I usually prefer functions where state is minimal. There are no mixins, though.

- Prefer external functions over private state. If you need to reuse that private function elsewhere, export that function as well. Functions don't keep much state, and are easier to test. They also don't have `this` issues.

- If you need a platform-indepenent global, consult `src/global.js` for a global reference. Note that you won't need it for the CLI.

## License

ISC, unless otherwise stated.
