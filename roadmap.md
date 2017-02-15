# Roadmap

This list is in a very rough chronological order, with whatever's done struck through. If you want to complete any of these yourself, feel free to send me a PR! :smile:

Do note that it isn't necessarily comprehensive, although I try to keep it somewhat up to date.

## 0.3.0

See the [changelog](https://github.com/isiahmeadows/thallium/blob/master/CHANGELOG.md#v030).

## 0.3.x
(not blocking 0.3.0)

1. ~~Add OS X to the Travis build~~
    - ~~Travis has been having OS X issues lately, making debugging these errors a little harder~~
2. ~~Add diff support to all existing reporters~~
3. ~~Create/finish DOM reporter~~
4. ~~Support flaky tests via first-class retries~~
    - ~~This is a requirement to self-host the runner~~
5. ~~Move `thallium/match` and `thallium/assert` implementations out of core~~
    - ~~`thallium/match` is useful on its own~~
    - ~~Third-party assertions should be able to build off the same basic assertion primitives without depending on `thallium`~~
    - ~~The assertions' core primitives are already fairly stable~~
6. ~~Add `t.hasReporter()` so the CLI can detect no reporter set and add the appropriate default.~~
7. Support failable tests
    - You may want to run a buggy test while still not letting it fail. It helps you know which tests are buggy, and to just not run them if they are
    - Add a `t.run()` option to run or skip these
8. Make `t.only` also a `t.run()` option
    - Now that `t.only` is detected at test run time, this is way easier to do, and it just makes more sense here than as a setter
    - Also, accept a `skip` option.

## 0.4.0

Note that as of this version, only the primary API of the previous version will be supported as much as feasibly possible through `thallium/migrate`. Reporter and plugin APIs will not such have a wrapper available, but may use the utilities in `thallium/migrate/support` to use while transitioning.

1. Remove all the previously deprecated methods/etc.
    - Additionally, seal all API types, as a safety net
    - Remove `reflect.own*` properties and make all properties own and parasitically inherited from their parent, to avoid costly lookups (already done for attempts)
2. Expose `thallium` as global `t` in bundle, tack existing `tl.*` exports onto it
    - Expose `thallium/assert` as global `assert` instead
    - Don't expose `require("thallium")`
3. Add some promise-aware assertions (in `clean-assert`)
4. Move `exports.files` config option to `t.files`
    - Change `exports.thallium` to default export
    - Ignored by core, but will mildly simplify CLI interface
    - Will make parallel interface much more consistent
5. Allow full name matching of `t.only`
    - Detected via no array
    - Feature parity with most other heavy frameworks
6. Add `t.runOptions` getter/setter for default run options
7. Add some useful things for test generation and reporters like getting the full test name
8. Make reports backed by a tree, and convert the public API to expose only getters
    - Abstracts away the internal representation
    - Reduce reporter GC
9. Cache the settings for child tests after they are re-locked
    - This gets rid of all the tree climbing nonsense that currently exists
    - This will streamline settings a *lot* more
10. Add file watching support
    - Just invoke the CLI with `--force-local` and the appropriate Node flags on each change. Way easier than trying to clean up `node_modules`, and you get more easily reproduced runs
11. Add the ability to programmatically skip a test before it completes
    - Required for integration tests
    - `t.skip()`/`reflect.skip()` throws an `reflect.Skip` (an Error subclass) to skip a test
12. Expose `thallium/internal` as `reflect.internal()`
13. Expose a detached `reflect` via `t.reflect()`
    - Mainly for easier testing/etc.
14. Load bundle automatically, and implement `data-*` attribute options

## 0.4.x
(not blocking 0.4.0)

1. Trim off internal stack traces when sending errors to reporters
2. Integrate with Karma
3. Add parallel testing support
    - This will involve a secondary child config
    - This will require a dedicated worker pool
    - Parallelism must be an option

## 0.5

1. Add first-class support for multiple test groups and test group dependencies
    - I see this a lot in Java circles, but not in JS circles
    - I could already use this to some degree here (I already frequently disable the end-to-end tests in normal development)
    - There must be a way to keep a test out of the default group
2. Add ability to denote inter-test dependencies, and skip ones that depend on failed tests
    - Sometimes, a test error can result in others starting with invalid state
    - It's sometimes easier to do integration-style tests, testing each step along the way (particularly useful for testing state machines)
    - This is something no existing test framework I'm aware of actually offers in any capacity
    - This could be done by adding a per-group boolean flag (skip rest of group if test in own group or group dependency fails)

## 0.6

1. Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that is completely untested and completely unaware of ES6 :worried:
    - This will be published out of core
2. Create a nice REPL driver for Node, in addition to the CLI\*
    - This will just be a module + sugar binary, so you can use it with any language

\* *That's something from Lisp-land I really wish was here...*

## Later

Here's the nice-to-haves, and so these are in no particular order:

- Migrate to TypeScript internally (low priority)
    - I'm having enough of the highly uninformative `TypeError: foo has no method bar`, `TypeError: Cannot read property 'bar' of undefined`, `TypeError: object #<Object> is not a function`, etc. (At least Node 6 gives the variable name...)
    - I get arrow functions and classes for free, without having to deal with Babel's monstrosity
    - Downleveled async functions will drastically simplify both the runner and all the reporters
    - It'll be a *lot* easier when most of the deprecated dynamic stuff like test inheritance is finally removed

- Self-host the runner

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
    - There doesn't appear to be a JS port yet, and algorithm documentation is scarce, so I'd have to write it myself, and it will likely be challenging
