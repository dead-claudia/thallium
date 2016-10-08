# Reporter API

If you want to create your own reporter, it's relatively straightforward to do so. Thallium reporters are simple functions that accept a set of event objects. It's written to be very unopinionated, easy to work with, and if you feel a need to convert it to something else, it's very straightforward to do.

Reporters are called with an event and return possibly a thenable resolved on completion.

Note that when you create a reporter, especially a standalone one, it should *not* itself depend on Thallium, but merely be a function of report &rarr; update state &rarr; print (if necessary) &rarr; return. If you feel you need to depend on Thallium, you should consider wrapping the reporter in a [plugin](./plugins.md) and exposing that.

## Events

There are nine types of events. You can check for these using `ev.start()`, `ev.enter()`, and so on, which return `true` if the event is of that respective type or `false` otherwise. Note that an event only has one type, so `ev.pass()` and `ev.fail()` cannot both be `true`.

- `start` - Marks the start of all running tests, and is the first event fired.
- `enter` - Marks the start of all child tests within a single test block.
- `leave` - Marks the end of all child tests within a single test block.
- `pass` - Marks a passing test block with no children.
- `fail` - Marks a failing test block with no children. The `value` is the error that was thrown, untouched.
- `skip` - Marks a skipped test block with no children, via `t.testSkip()` or `t.asyncSkip()`.
- `end` - Marks the end of all running tests, and is the last event fired.
- `error` - An internal/reporter error `value`, provided for pretty-printing and the ability to close resources.

Each event also has the following properties:

- `_` - A property reserved for internal (ab)use. Please leave this alone, and don't rely on anything other than its existence.
- `value` - The value associated with the event, or `undefined` if none was specified above for the event's type.
- `path` - The path to the test, from the top-most parent to the current test. For the base test, this is an empty array. Each entry of this array is a location object with `name` representing the name of the associated test and `index` representing the 0-based index of the test.
- `slow` - The active slow duration for the test. This is positive for `pass`, `fail`, and `enter` events, and 0 for all others.
- `duration` - The time it took for this test to complete. This is either 0 or positive for `pass`, `fail`, and `enter` events, and -1 for all others.

The `error` event is for handling errors either thrown from Thallium or the reporter itself. At this point, it's recommended to close the reporter, as it's no longer safe to continue. As an exception, errors from handling `extra` reports are silently ignored for practical reasons (it's an exceptionally complex problem, where I'd have to roll my own async abstraction), and errors from handling `error` reports are fatal. If you would prefer to just propagate those errors, you can simply rethrow the event's `value`.

## Event Order

Events are called in the following order:

- Global scope or directly called test:

    1. `start` to start the stream
    2. Events for each child test
    3. `end` to end the stream

- Test passing and with children:

    1. `enter` to denote start of children
    2. Events for each child test
    3. `leave` to denote end of children

- Any other test:

    - `pass` if all assertions passed
    - `skip` if it was skipped via `t.testSkip()` or `t.asyncSkip()`
    - `fail` if any assertion failed

## Calling behavior

Normally, reporters are all called at the same time on each event, to speed up calling asynchronous reporters.

If your reporter is async *and* needs to be the only one running for some reason (like multiple reporters working with a poorly written server or printing diagnostics to the console along with another console reporter), you should add a truthy `block` property to your reporter. It's not preferred, because if you want to, for example, use a reporter that logs to a file, that will have to wait until after the blocking reporter finishes.

## Options and Internal State

If you need to take various options, or if you need special internal state, just wrap your reporter in a factory like this:

```js
module.exports = opts => {
    // process your opts and set up initial state here

    return ev => {
        // do reporter magic here
    }
}
```

The built-in reporters do this as well, and it's recommended to wrap the reporter even if you don't need it, just for idiomatic consistency.

If you want to guard against your reporter being erroneously not called first, you can use this helper, also used internally, to make it much easier.

```js
var hasOwn = Object.prototype.hasOwnProperty

function isReport(object) {
    // `_` is an identifier reserved for internal use.
    if (!hasOwn.call(object, "_")) return false
    if (!hasOwn.call(object, "path")) return false
    if (!hasOwn.call(object, "value")) return false
    if (!hasOwn.call(object, "duration")) return false
    if (!hasOwn.call(object, "slow")) return false

    return Array.isArray(object.path) &&
        typeof object.duration === "number" &&
        typeof object.slow === "number"
}

// Usage
module.exports = opts => {
    if (isReport(opts)) {
        throw new TypeError("opts is a report - remember to call this first!")
    }

    // set up things...

    return ev => {
        // do things...
    }
}
```

Note that you still shouldn't depend on Thallium and check if it's a [`Report`](./api/reflect.md#report) instance.

## `extra` events after `end`

If you can't handle them after the exit, you can drop a lock like this, so you can avoid processing to keep out of an invalid state. Note that after the `end` event, only two possible events can occur: `extra`, since Thallium has already moved on by then, and `start`, which means the tests are being run again with the same reporter, within the same Node process.

```js
module.exports = () => {
    let ignore = false

    return (ev) => {
        if (ev.extra() && ignore) return undefined
        if (ev.start()) ignore = false
        if (ev.end()) ignore = true

        // do whatever you would normally
    }
}
```

## Why not event emitters? Why not observables?

I'd like to keep Thallium simple and less opinionated. It's easy to wrap the current format, and I've even written plugins to help you out in the case of [event emitters](./examples/ee-reporter.js) and [observables](./examples/observable-reporter.js). There's also CoffeeScript equivalents for each ([event emitters](./examples/ee-reporter.coffee) and [observables](./examples/observable-reporter.coffee)). But functions are still simpler to implement and consume, and the events passed are pretty similar.
