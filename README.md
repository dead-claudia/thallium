# Thallium

[![Travis Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/f9lhn8ivfwj39k7k?svg=true)](https://ci.appveyor.com/project/isiahmeadows/thallium)
[![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 4 and later, as well as PhantomJS 2 and browsers (tested in Chrome and Firefox).

*Note that this is a huge work in progress, and is probably not suited for production projects.*

## Installation

First, install [Node and npm](https://nodejs.org/en/download/).

```sh
npm install --save-dev thallium

# If you would like it globally installed, that works, too.
npm install --global thallium
```

Also, if you target older runtimes like PhantomJS or Internet Explorer, this will require a Promise polyfill, such as [es6-promise](https://github.com/stefanpenner/es6-promise). That polyfill in particular is used in this library to test PhantomJS 2.

## Usage and API

Check out the [documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/README.md).

```
tl
```

Couple specific notes:

1. You can use the framework without the built-in assertions. They're there just to make this a little more batteries-included (install one thing, and you're ready to go).

2. Not much configuration is required to get started. Just write your tests in a `test` folder (in JavaScript, of course), and everything just works with that command. I aim for simplicity and convention over configuration, but I also aim for as much flexibility as you need, so the configuration is mostly procedural code.

    - You can also just create a single file, and run `tl test.js`.

## Versioning

As soon as it's 1.0, I'll stick to [semver](https://semver.org). Until then, here's how I'll aim for new versions:

- Minor versions (`0.x`) represent larger breaking changes or larger new features. This includes much of the primary roadmap below.
- Patch versions (`0.1.x`, `0.2.x`, etc.) represent bug fixes and smaller breaking changes/new features. This includes some of the nice-to-haves I've listed below the roadmap.

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
9. ~~Remove the `thallium` and `_thallium` aliases, and rename the repo's binaries accordingly~~~
    - ~~Only `tl` is actually documented~~
10. ~~Add more useful introspection methods (e.g. test name, test index, test's children, etc.)~~
11. ~~Add `t.call(plugin)`, where `plugin` accepts a `reflect` instance, and the result is returned untouched~~
    - ~~Deprecate `t.reflect()`, equivalent to `t.call(reflect => reflect)`~~
    - ~~Deprecate `t.use(...plugins)`, equivalent to the following:~~

    ```js
    t.call(reflect => {
        const t = reflect.methods
        plugins.forEach(plugin => { plugin.call(t, t) })
    })
    ```
12. ~~Create before/after lifecycle hooks~~
13. ~~Rename `t.async` &rarr; `t.test`, deprecate old form~~
14. ~~Support a `.tl.opts` file to prepend CLI arguments (and way to disable it)~~
15. ~~Add [AppVeyor](https://www.appveyor.com/) support for Windows testing~~
16. ~~Add PhantomJS 2 to the Travis build~~
17. ~~Drop support for Node pre-4~~
    - ~~ES6 goodies now available in the CLI~~
    - ~~This doesn't happen until I get PhantomJS 2 running~~
18. ~~Move `reflect.loc` and `reflect.report` to their own module and deprecate them~~
19. ~~Complete migration utility~~
20. ~~Add `reflect.current` to get current running test as a `Reflect` (not necessarily that of the backing instance)~~
    - ~~This could potentially be difficult, but will be immensely useful for plugin authors~~
    - ~~Deprecate first `t` argument and `reflect.methods` in favor of this + function scoping~~
21. Update existing documentation

**0.3.x:** (after 0.3.0)

1. Add OS X to the Travis build
    - Travis has been having OSX issues lately, making debugging these errors a little harder.
2. Add diff support to all existing reporters
3. Create DOM reporter
4. Document all the assertions
5. Support flaky tests via first-class retries
    - This is a requirement to self-host the runner
6. Move `thallium/match` and `thallium/assert` implementations out of core

**0.4:**

1. Remove all the previously deprecated methods/etc.
2. Transition to TypeScript
    - I'm having enough of the highly uninformative `TypeError: foo has no method bar`, `TypeError: Cannot read property 'bar' of undefined`, `TypeError: object #<Object> is not a function`, etc. (At least Node 6 gives the variable name...)
    - I get arrow functions and classes for free, without having to deal with Babel's monstrosity
3. Add parallel testing support.
    - This will be based on a beast created and managed separately from core.
4. Add some promise-aware assertions

**0.4.x:** (after 0.4.0)

1. Trim off internal stack traces when sending errors to reporters
2. Add file watching support
3. Integrate with Istanbul
4. Add support for running tests in parallel

**0.5:**

1. Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that is completely untested and completely unaware of ES6. :worried:
    - This will be published out of core
2. Create a nice REPL driver for Node, in addition to the CLI.\*
    - This will just be a module + sugar binary, so you can use it with any language

\* *That's something from Lisp-land I really wish was here...*

**Later:**

Here's the nice-to-haves, and so these are in no particular order:

- Write a few plugins/utilities for `describe`/`it` (likely trivial), etc
    - This will include more reporters as well

- Write lots of blog posts. :smile:
    - Why another testing framework (we already have [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/), [QUnit](https://qunitjs.com/), [AVA](https://github.com/avajs/ava), [Tape](https://github.com/substack/tape) [and](https://www.npmjs.com/package/tap) [friends](https://www.npmjs.com/package/tt), [Nodeunit](https://github.com/caolan/nodeunit), [among](http://docs.busterjs.org/en/latest/overview/) [others](https://www.npmjs.com/package/ospec))
    - Why this uses code *for* configuration (Gulp vs Grunt, Browserify vs Webpack, ESLint vs JSHint+JSCS, etc.)
    - Why this tries to infer so much (it's not as magical as it seems, and magic isn't inherently evil)
    - Why such a high focus on flexibility
    - etc.

- Write an alternative matching algorithm to be based off of the ES2015 Iterable (`Symbol.iterator`) protocol, etc.
    - This may likely also include the [proposed async iteration protocol](https://github.com/tc39/proposal-async-iteration#async-iterators-and-async-iterables).
    - This will be out of core

- Use the patience diff for larger data sets, since it deals with those a little more readably, a plus for data-heavy integration/end-to-end tests (this repo has some of those)
    - There doesn't appear to be a JS port yet, and algorithm documentation is scarce, so I'd have to write it myself, and it will likely be challenging.

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md).

## License

The following license (ISC License), unless otherwise stated:

Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com> and others.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
