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

- Everything is in [LiveScript](http://livescript.net), an expressive, compile-to-JavaScript language.
    - If you're familiar with that language and its ecosystem, note that I'm not using [prelude-ls](http://www.preludels.com). The code is done a little more imperatively.
- [Bluebird](http://bluebirdjs.com) is used extensively as the Promise implementation.
- The source code is in `src/**`.
- The executables are in `bin/**`, but they won't work. Most of the CLI code is in `src/cli/**`.
- The documentation and examples are in `docs/**`.
- The tests are in `test/**`.
    - Mocha is used to run the tests, and the assertions are self-hosted.
    - Fixtures for those tests are in `test-fixtures/**`.
    - Utilities are in `test-util/**`.
- The compiled output is in `lib/**`. Do note that this isn't checked into Git.
- This uses [eslint-config-isiahmeadows](https://npmjs.com/package/eslint-config-isiahmeadows) for its presets. In case you're curious what those settings are, you can start with [the index file](https://github.com/isiahmeadows/eslint-config-isiahmeadows/blob/master/index.js), which the rest are only minor variations of.

Tips and idioms:

- There's a little helper in `test-util/base.ls` named `a`, defined as `a = -> [.. for &]`. It creates an array equivalent to an array literal, but using a function call. It's helpful for reducing parentheses and brackets in the tests. Oh, and there's a few other nice utilities as well (not comprehensive):

    - `fixture :: name -> directory` - Get a fixture's path from `test-fixtures/**`.
    - `push :: array -> plugin` - A plugin that accepts an array destination argument, and stores its reports in it.
    - `n :: type, path, value -> reporterNode` - Create a reporter node of a given type, path, and value.
    - `p :: name, index -> pathNode` - Create a path node with a given name and index

    These are most frequently used for testing reporter output for whatever reason.

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage to simplify your testing. For example, I used a combination of `t.reporter` and `t.deepEqual` to test the reporter output throughout the tests. Here's an example from one of the tests:

    ```ls
    tt = t.base!
    ret = []

    tt.reporter push ret

    tt.test 'test', !->
    tt.test 'test', !->

    tt.run!then !->
        t.deepEqual ret, a do
            n 'start', []
            n 'start', a p 'test', 0
            n 'end', a p 'test', 0
            n 'pass', a p 'test', 0
            n 'start', a p 'test', 1
            n 'end', a p 'test', 1
            n 'pass', a p 'test', 1
            n 'end', []
            n 'exit', []
    ```

- Classes are used throughout, but only to describe large ADTs and non-trivial state. For simpler cases, I prefer plain objects, sometimes created by a factory if the same structure is used multiple times, and I usually prefer functions where state is minimal. There are no mixins, though.

- Prefer external functions over private state. If you need to reuse that private function elsewhere, export that function as well. Functions don't keep much state, and are easier to test. They also don't have `this` issues.

## License

ISC, unless otherwise stated.
