# Reporters

Techtonic reporters are simple functions that accept a set of event objects. It's written to be very unopinionated, easy to work with, and if you feel a need to convert it to something else, it's very straightforward to do.

Reporters are simple functions that are called with an event and either return a thenable or accept a `done` callback, resolved or called respectively when you're done processing the event. Do note that if you never call `done` or resolve the promise, the runner will hang.

## Events

Each event is specified by the `type` property:

- `"start"` - This marks the start of all tests or a single test block. The `value` property is `undefined`.
- `"end"` - This marks the end of all tests or a single test block. The `value` property is `undefined`.
- `"pass"` - This marks a passing test block. The `value` property is `undefined`.
- `"fail"` - This marks a failing test block. The `value` property is the error that was thrown, unmodified.
- `"pending"` - This marks a pending test block, from `t.testSkip()` or `t.asyncSkip()`. The `value` property is `undefined`.
- `"exit"` - This marks the end of all running tests. The `value` property is `undefined`. If you need to buffer any events, this marks the end of the stream, so you can start your final processing.
- `"extra"` - This marks an extra call to `done` in an asynchronous test. The `value` property is an object where `count` denotes how many times `done` was called overall, and `value` denotes the last value the callback was called with.

Each event has the following properties:

- `type` - A string representing the event type above.
- `value` - The associated value described by each event above, or `undefined` if none is applicable.
- `path` - The path to the test, from the top-most parent to the current test. For the base test, this is an empty array. Each entry of this array is an object with `name` representing the name of the associated test and `index` representing the 0-based index of the test.

## Calling behavior

Normally, reporters are all called at the same time on each event, to speed up calling asynchronous reporters.

If your reporter is asynchronous *and* needs to be the only one running (like writing asynchronously to the console), you should add a truthy `block` property to your reporter. It's generally not preferred, though.

## Options

If you need to take various options, just wrap your reporter in a factory like this:

```js
module.exports = opts => {
    // process your opts here

    return ev => {
        // do reporter magic here
    }
}
```

## Why not event emitters? Why not observables?

I'd like to keep Techtonic simple and less opinionated. It's easy to wrap the current format, and I've even written plugins to help you out in the case of [event emitters](./examples/ee-reporter.js) and [observables](./examples/observable-reporter.js). There's also CoffeeScript equivalents for each ([event emitters](./examples/ee-reporter.coffee) and [observables](./examples/observable-reporter.coffee)). But functions are still simpler to implement and consume, and the events passed are pretty similar.
