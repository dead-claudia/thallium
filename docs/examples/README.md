# Examples

This directory contains several examples that augment the documentation. These
are written in ES6 with [CoffeeScript](http://coffeescript.org) equivalents for
each of them.

- [Event Emitter wrapper for reporters](./ee-reporter.js) +
    [CoffeeScript version](./ee-reporter.coffee)

- Convert `t.reporter()` to
    [return an Observable when called without arguments](./observable-reporter.js) +
    [CoffeeScript version](./observable-reporter.coffee)

Also, the acceptance tests in [this directory](../../test-fixtures/acceptance/large-coffee)
provide a good example of how you could write some of your tests. They mirror
some of the existing tests to demonstrate a real-world scenario.
