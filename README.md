# Thallium

[![Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node v0.10 and later, as well as browsers (although it's not as well tested).

*Note that this is a huge work in progress, and is probably not suited for production projects.*

## Installation

```
npm install --save-dev thallium
```

## Usage and API

Check out the [documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/README.md).

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

## Versioning

As soon as it's 1.0, I'll stick to [SemVer](https://semver.org). Until then, here's how I'll aim for new versions:

- Minor versions (`0.*`) represent larger breaking changes or larger new features. This includes much of the primary roadmap below.
- Patch versions (`0.1.*`, etc.) represent bug fixes and smaller breaking changes/new features. This includes some of the nice-to-haves I've listed below the roadmap.

I will try to avoid breaking changes on patch updates, but it's not guaranteed, particularly if it's because a bug fix.

## Recent Updates

See the [changelog](https://github.com/isiahmeadows/thallium/blob/master/CHANGELOG.md) for the most recent published changes. It also contains some useful migration information for dealing with breaking changes.

## Roadmap

This list is in a very rough chronological order, with whatever's done struck through. If you want to complete any of these yourself, feel free to send me a PR! :smile:

Do note that it isn't necessarily comprehensive, although I try to keep it somewhat up to date.

**0.3:**

1. ~~Expose matching algorithm~~
2. ~~Separate assertions from test instance~~
3. ~~Allow for arguments to be bound for `t.try` (was `reflect.do`)~~
4. ~~Remove support for generators in `t.async` in favor of [`co`](https://www.npmjs.com/package/co), async functions, etc.~~
5. ~~Make most of the CLI/reporter constants configurable~~
6. ~~Remove `done` callback support for `t.async`, reporters, etc.~~
7. ~~Allow reporters to be removed~~
8. ~~Add default config~~
9. Create before/after lifecycle hooks
10. Rename `t.async` &rarr; `t.test`, deprecate old form
11. Add a `.tl.opts` file to prepend CLI arguments (and way to disable it)
12. Add `reflect.api()` to get current running test (not necessarily that of the backing instance)
13. Add `t.call(plugin)`, where `plugin` accepts a `reflect` instance, and the whole thing returns the function's result, and deprecate `t.use(plugin)` and `t.reflect()` in favor of the above
14. Add diff support to all existing reporters
15. Add PhantomJS and OS X to the Travis build, and [AppVeyor](https://www.appveyor.com/) support for Windows testing
16. Complete migration utility
17. Update existing documentation

**0.4:**

1. Remove all the deprecated 0.2 crud
2. Create DOM reporter
3. Add some promise-aware assertions
4. Document all the assertions
5. Drop support for Node pre-4
6. Support flaky tests via first-class retries
    - This is a requirement to self-host the runner
7. Trim off internal stack traces when sending errors to reporters
8. Add file watching support
9. Integrate with Istanbul

**0.5:**

1. Move `thallium/match` and `thallium/assert` out of core
2. Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that is completely untested and completely unaware of ES6. :worried:
    - This will be published out of core
3. Add support for running tests in parallel

**Later:**

Here's the nice-to-haves, and so these are in no particular order:

- Create a nice REPL driver for Node, in addition to the CLI.\*
    - This will just be a module + sugar binary, so you can use it with any language

- Write a few plugins/utilities for `describe`/`it` (likely trivial), etc
    - This will include more reporters as well

- Write lots of blog posts. :smile:
    - Why another testing framework
    - Why this uses code *for* configuration
    - Why this tries to infer so much (it's not as magical as it seems)
    - Why such a high focus on flexibility
    - etc.

- Write an alternative matching algorithm to be based off of the ES2015 Iterable (`Symbol.iterator`)/etc. protocols from the core.
    - This may include the [proposed async iteration protocol](https://github.com/tc39/proposal-async-iteration#async-iterators-and-async-iterables) in the future.

- Use the patience diff for larger data sets, since it deals with those a little more readably, a plus for data-heavy integration/end-to-end tests (this repo has some of those)
    - There doesn't appear to be a JS port yet, and algorithm documentation is scarce, so I'd have to write it myself, and it could be challenging.

\* *That's something from Lisp-land I really wish was here...*

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md).

## License

The following license (ISC License), unless otherwise stated:

Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com> and others.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
