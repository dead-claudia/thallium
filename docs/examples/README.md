# Examples

This directory contains a few examples that augment the documentation. These are written in ES6 with [CoffeeScript](http://coffeescript.org) equivalents for each of them.

- [Event Emitter wrapper plugin for reporters](./ee-reporter.js) + [CoffeeScript version](./ee-reporter.coffee)

- Convert `t.reporter()` in a plugin to [return an Observable when called without arguments](./observable-reporter.js) + [CoffeeScript version](./observable-reporter.coffee)

- A [basic TAP-generating reporter in ES2017](./tap-reporter.js) + [CoffeeScript version](./tap-reporter.coffee) that is a bit simpler and stripped down than the [main one](../reporters.md).

Also, the end-to-end tests in [this directory](http://github.com/isiahmeadows/thallium/tree/master/fixtures/large-coffee) provide a good example of how you could write some of your tests. They mirror some of the existing tests to demonstrate a more real-world scenario.
