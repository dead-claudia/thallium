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

1. Finish + test the CLI. It's still a work in progress, mostly in testing.
2. Finish documenting this project. This mainly includes the core assertions and CLI.
3. Self-host this module's tests like what Mocha does.
4. Port this to the browser.
5. Write a few plugins for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, etc.
6. Write lots of blog posts. :smile:

## License

ISC, unless otherwise stated.
