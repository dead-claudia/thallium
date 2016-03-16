# Reporters

Techtonic reporters are simple functions that accept a set of objects. It's written in such a way that it's exceptionally unopinionated, and easy to convert into whatever you would rather work with.

Reporters are functions that accept a test event and either return a thenable or accept an additional `done` callback that *must* be called when the reporter is finished processing the current event.

## Events

Reporters accept any of these events, specified by the `type` property:

- `"start"`

    This marks the start of all tests or a single test block. The `value` property is `undefined`. The `index` property is -1.

- `"end"`

    This marks the end of all tests or a single test block. The `value` property is `undefined`. The `index` property is -1.

- `"pass"`

    This marks a passing test block. The `value` property is `undefined`.

- `"fail"`

    This marks a failing test block. The `value` property is the error that was thrown, unmodified.

- `"pending"`

    This marks a pending test block, using `t.testSkip()` or `t.asyncSkip()`. The `value` property is `undefined`.

- `"exit"`

    This marks the end of all running tests. The `value` property is `undefined` and the `index` property is 0. If you have to buffer any events, this is your cue to finish processing all tests you have buffered.

- `"extra"`

    This marks an extra call to `done` in an asynchronous test.

    The `value` property is an object with a `count` property to denote how many times `done` was called in total, and a `value` property denoting what the callback was last called with.

    The `name` property is the currently executing test or `undefined` if this is the base test. This property is merely here for consistency.

    The `parent` property is an array of objects with a `name` representing the name of the test and an `index` representing the index of the relevant test. The objects are in order from top-most to bottom-most. This inconsistency is because the call is already outside of the otherwise balanced structure, and it's easier to create and iterate an array than an object.

Each event has the following properties:

- `type` - A string representing the event type above.

- `value` - The associated value for the event, or `undefined` if none exists.

- `path` - The path to the test, from the top-most parent to the current test. For the base test, this is an empty array.

    Each entry of this array is an object with the following properties:

    - `name` - The name of the associated test.
    - `index` - The 0-based index of the test.

## Calling behavior

Normally, reporters are all called at the same time on each event, unless they specify a truthy `block` property. This helps speed up asynchronous reporters.

If your reporter is asynchronous *and* needs to be the only one running (like writing asynchronously to the console), you can (and should) add a truthy `block` property to your reporter. If possible, you should prefer a locking mechanism to this property, because it *will* slow down reporters.

## Options

If you need to take various options, just wrap your reporter in a factory like this:

```js
module.exports = function (opts) {
    return function (ev) {
        // do reporter magic here
    }
}
```

## Why not event emitters? Why not observables?

Those are opinions that I don't want to have with Techtonic. It's also simpler to handle single functions instead of event emitters or observables.

If you really feel you need to wrap this to support those, I have example plugins to wrap `t.reporter()` for both [event emitters](./examples/ee-reporter.js) and [observables](./examples/observable-reporter.js). There's also CoffeeScript equivalents for each ([event emitters](./examples/ee-reporter.coffee) and [observables](./examples/observable-reporter.coffee)).
