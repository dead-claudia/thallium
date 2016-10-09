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

See the [changelog](https://github.com/isiahmeadows/thallium/blob/master/CHANGELOG.md) for the most recent changes. It also contains some useful migration information for dealing with breaking changes.

## Roadmap

This list is in a very rough chronological order. If you want to complete any of these yourself, feel free to send me a PR! :smile:

1. ~~Create basic reporters for TAP, spec, and dot.~~ **Done!**
    - ~~Browser support~~ and a DOM reporter is planned as well.

2. ~~Allow reporters to be removed.~~ **Done!**

3. Finish documenting this project. This mostly includes the core assertions.

4. Support flaky tests via first-class retries. This would be enormously useful for several, and it's an absolute requirement for this to self-host its runner.

5. Yank `thallium/match` and `thallium/assert` out of core. They don't need to be coupled.

5. Include lifecycle hooks for before/after tests, for resource management.

6. Create a nice REPL driver for Node, in addition to the CLI.\*
    - This will just be a module + sugar binary, so you can use it with any language.

7. Write a few plugins/utilities for `describe`/`it` (likely trivial), `before{,Each}`/`after{,Each}` hooks, etc.
    - This will include more reporters as well.

8. Write lots of blog posts.\*\* :smile:
    - Why this uses code *for* configuration, unlike nearly every other test framework out there.

\* *That's something from Lisp-land I really wish was here...*

Also, at some point, I'd like to do the following, in no particular order:

- Set up [AppVeyor](https://www.appveyor.com/) to run tests on Windows. Currently, it's only actively tested on Linux, although I do try to keep it as platform-independent as possible.

- Test this in PhantomJS. It should work in its current state, but it's not tested.

- Trim the stack traces on reported errors and offer that to others as well.

- Write an alternative matching algorithm to be based off of the ES2015 Iterable (`Symbol.iterator`)/etc. protocols from the core.
    - This may include the [proposed async iteration protocol](https://github.com/tc39/proposal-async-iteration#async-iterators-and-async-iterables) in the future.

- Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that ponyfill module is completely untested and is unaware of ES6. :worried:

    - This'll end up out of core.

- Use the patience diff for larger data sets, since it deals with those a little more readably, a plus for data-heavy integration/end-to-end tests (this repo has some of those), but there doesn't appear to be a JS port yet, and algorithm documentation is scarce.

- Add file watching support for this.

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md).

## License

The following license (ISC License), unless otherwise stated:

Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com> and others.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
