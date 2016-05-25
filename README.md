# Thallium

[![Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 0.10 and later, and browser support is also planned.

*Note that this is a huge work in progress.*

## Installation

```
npm install --save-dev thallium
```

## Usage

Check out the [CLI documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/cli.md)

```
tl
```

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

1. Create basic reporters for ~~TAP,~~ ~~spec,~~ dot, and DOM.
    - Note that these four + browser tests through Firefox in Travis are directly blocking 0.1.
2. Finish documenting this project. This mainly includes the core assertions.
3. Support flaky tests via first-class retries. This would be enormously useful for several.
4. Allow reporters to be removed, with an on-remove hook for the reporter in case external resources need reclaimed.
5. Create a nice REPL driver for Node, in addition to the CLI.\*
    - This will just be a module + sugar binary, so you can use it with any language.
6. Write a few plugins/utilities for `describe`/`it` (likely trivial), `before{,Each}`/`after{,Each}` hooks, etc.
    - This will include more reporters as well.
7. Write lots of blog posts.\*\* :smile:
    - Why `before{,Each}` and friends aren't in core
    - Why this uses code *for* configuration, unlike nearly every other test framework out there.

\* *That's something from Lisp-land I really wish was here...*

\*\* *And maybe port this to Python, if/when I can find time.*

Also, at some point, I'd like to do the following, in no particular order:

- Set up [AppVeyor](https://www.appveyor.com/) to run tests on Windows. Currently, it's only actively tested on Linux ~~and in browsers~~ (as soon as I can get [Sauce Labs](https://saucelabs.com/) and [zuul](https://github.com/defunctzombie/zuul) running...likely with a complex [Webpack](https://webpack.github.io) setup).
- Trim the stack traces on reported errors and offer that to others as well.
- Profile and optimize this thing. Currently, the CLI runs slightly slower than Mocha, but I know I can do better.
    - For one, the config search doesn't have to be synchronous.
- Allow initial negative globs based on the config's list (or the default).
- Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that ponyfill module is completely untested and is unaware of ES6. :worried:
- Implement my own glob-based walker for this to eliminate order non-determinism and speed up resolution. To my knowledge, none of the more popular utilities are deterministic, and determinism is very helpful for testing. Plus, a specialized variant would load things much quicker. :smile:
- Include the patience diff as a reporter option, since it deals with larger diffs a little more readably, a plus for data-heavy integration/end-to-end tests, but there doesn't appear to be a JS port yet, and algorithm documentation is scarce.
- Implement something like `mocha --watch` for this.

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md)

## License

ISC, unless otherwise stated.
