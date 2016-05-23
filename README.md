# Thallium

[![browser support](https://ci.testling.com/isiahmeadows/thallium.png)
](https://ci.testling.com/isiahmeadows/thallium)
[![Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 4 and later, and browser support + legacy Node is also planned.

*Note that this is a huge work in progress.*

## Installation

```
npm install --save-dev thallium
```

## Usage

This is waiting on the completion of the reporters, but for now, you can look at the [documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/README.md) and [tests](http://github.com/isiahmeadows/thallium/tree/master/test/), which use Thallium's assertions for nearly everything.

Couple specific notes:

1. You can use the framework without the built-in assertions. Use `thallium/core`, which has none of them preloaded, and implement your own assertions. Matter of fact, the built-in ones are actually themselves a plugin, `thallium/assertions`.

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

See the [documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/README.md).

## Roadmap

This list is in a very rough chronological order.

1. Create basic reporters for ~~TAP,~~ ~~spec,~~ dot, DOM, etc.
    - Note that these four I've listed are directly blocking 0.1.
    - Also, create a playground fixture for developing new reporters, to make design much easier.
2. Set up [AppVeyor](https://www.appveyor.com/) to run tests on Windows. Currently, it's only actively tested on Linux and in browsers.
3. Allow for multiple configs that override and augment each other, initial negative globs that act based on the config's files (or the default), and a way to evaluate a module directly in the CLI relative to the current working directory.
    - That last one will be a bit more difficult than the others.
4. Finish documenting this project. This mainly includes the core assertions.
5. Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that module is completely untested and is unaware of ES6. :worried:
6. Write a few plugins/utilities for `describe`/`it`, `before{,Each}`/`after{,Each}` hooks, REPL friendliness\*, etc.
    - I'd also like to eventually include the patience diff as a reporter option, which would be helpful for automated integration/acceptance tests with a lot of data (this project is one of them), but it'll be really difficult considering how hard it is to find details on it, and the fact it likely needs ported first.
7. Write lots of blog posts.\*\* :smile:

\* *That's something from Lisp-land I really wish was here...*

\*\* *And port this to Python, when I can find time.*

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md)

## License

ISC, unless otherwise stated.
