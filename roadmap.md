# Roadmap

This list is in a very rough chronological order, with whatever's done struck through. If you want to complete any of these yourself, feel free to send me a PR! :smile:

Do note that it isn't necessarily comprehensive, although I try to keep it somewhat up to date.

## 0.3.0

See the [changelog](https://github.com/isiahmeadows/thallium/blob/master/CHANGELOG.md#v030).

## 0.3.x
(not blocking 0.3.0)

1. Add OS X to the Travis build
    - Travis has been having OSX issues lately, making debugging these errors a little harder.
2. Add diff support to all existing reporters
3. Create DOM reporter
4. Support flaky tests via first-class retries
    - This is a requirement to self-host the runner
5. Move `thallium/match` and `thallium/assert` implementations out of core

## 0.4.0

1. Remove all the previously deprecated methods/etc.
2. Transition to TypeScript
    - I'm having enough of the highly uninformative `TypeError: foo has no method bar`, `TypeError: Cannot read property 'bar' of undefined`, `TypeError: object #<Object> is not a function`, etc. (At least Node 6 gives the variable name...)
    - I get arrow functions and classes for free, without having to deal with Babel's monstrosity
3. Add some promise-aware assertions

## 0.4.x
(not blocking 0.4.0)

1. Trim off internal stack traces when sending errors to reporters
2. Add file watching support
3. Integrate with Karma
4. Add parallel testing support.
    - This will be based on a beast created and managed separately from core.

## 0.5.0

1. Reimplement [`util-inspect`](https://www.npmjs.com/package/util-inspect) for browsers based on Node's current [`util.inspect`](https://nodejs.org/api/util.html#util_util_inspect_object_options), since that is completely untested and completely unaware of ES6. :worried:
    - This will be published out of core
2. Create a nice REPL driver for Node, in addition to the CLI.\*
    - This will just be a module + sugar binary, so you can use it with any language

\* *That's something from Lisp-land I really wish was here...*

## Later

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
