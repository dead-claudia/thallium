# Reporter API

If you want to create your own reporter, it's relatively straightforward to do so. Thallium reporters are simple functions that accept a set of event objects. It's written to be very unopinionated, easy to work with, and if you feel a need to convert it to something else, it's very straightforward to do.

Reporters are called with an event and return possibly a thenable resolved on completion.

## Report types

There are nine types of reports. You can check for these using `report.isStart`, `report.isEnter`, and so on, which return `true` if the event is of that respective type or `false` otherwise. You may also check for it with `report.type`, which returns a string name of the type below. Note that an event only has one type, so `report.isPass` and `report.isFail` cannot both be `true`.

- `start` - Marks the start of all running tests, and is the first event fired.
- `enter` - Marks the start of all child tests within a single test block.
- `leave` - Marks the end of all child tests within a single test block.
- `pass` - Marks a passing test block with no children.
- `fail` - Marks a failing test block with no children. The `value` is the error that was thrown, untouched.
- `skip` - Marks a skipped test block with no children, via `t.testSkip()`.
- `end` - Marks the end of all running tests, and is the last event fired.
- `error` - An internal/reporter error `value`, provided for pretty-printing and the ability to close resources.
- `hook` - A hook error info `value`, provided for pretty-printing and the ability to close resources.

Here's the properties for each event:

- `start` has no other properties
- `enter` also has `path`, `duration`, and `slow`
- `leave` also has `path`
- `pass` also has `path`, `duration`, and `slow`
- `fail` also has `path`, `duration`, `slow`, and `value` (the thrown/rejected error)
- `skip` also has `path`
- `end` has no other properties
- `error` has `value` (the thrown/rejected error)
- `hook` has `value` (the thrown/rejected error), `path`, and the following properties:

    - `stage` - A string representing the type of hook that failed.
    - `name` - The name of the function called by the hook
    - `isBeforeAll` - Whether this is a `beforeAll` hook that failed
    - `isBeforeEach` - Whether this is a `beforeEach` hook that failed
    - `isBfterEach` - Whether this is a `afterEach` hook that failed
    - `isBfterAll` - Whether this is a `afterAll` hook that failed

Here's what each of the common properties above represent (most reports have only some of these):

- `value` - The value associated with the event, or `undefined` if none was specified above for the event's type.
- `path` - The path to the test, from the top-most parent to the current test. Each entry of this array is a location object with `name` representing the name of the associated test and `index` representing the 0-based index of the test.
- `duration` - The time it took for this test to complete.
- `slow` - The active slow threshold for the test.

The `error` event is for handling errors either thrown from Thallium or the reporter itself. At this point, it's recommended to close the reporter, as it's no longer safe to continue. As an exception, errors from handling `extra` reports are silently ignored for practical reasons (it's an exceptionally complex problem, where I'd have to roll my own async abstraction), and errors from handling `error` reports are fatal. If you would prefer to just propagate those errors, you can simply rethrow the event's `value`.

### Event Order

Events are called in the following order:

- Global scope or directly called test:

    1. `start` to start the stream
    2. Events for each child test
    3. `end` to end the stream

- Preceding hooks failing:

    1. `hook` with the relevant hook info.

- Test passing and with children:

    1. `enter` to denote start of children
    2. Events for each child test
    3. `leave` to denote end of children

- Any other test:

    - `pass` if all assertions passed
    - `skip` if it was skipped via `t.testSkip()`
    - `fail` if any assertion failed

- Successive hooks failing:

    1. `hook` with the relevant hook info.

## Calling behavior

Reporters are all called at the same time on each event, to speed up calling asynchronous reporters. If you have to force reporters to not go simultaneously (e.g. for console output), you can use this function to make those work one-at-a-time per set:

```js
function combine(...reporters) {
    function clone(report) {
        return Object.assign(
            Object.create(Object.getPrototypeOf(report)),
            report)
    }

    return report => reporters.reduce(
        (p, reporter) => p.then(() => reporter(clone(report))),
        Promise.resolve())
}
```

## Options and Internal State

If you need to take various options, or if you need special internal state, just wrap your reporter in a factory like this:

```js
module.exports = opts => {
    // process your opts and set up initial state here
    let passing = 0

    return report => {
        // do reporter magic here
        if (report.isPass) passing++
    }
}
```

The built-in reporters do this as well, and it's recommended to wrap the reporter even if you don't need it, just for idiomatic consistency.

## Tips and tricks

- When you publish reporters on npm, you should declare Thallium as a [peer dependency](https://docs.npmjs.com/files/package.json#peerdependencies). This is to ensure your users have the correct version.

- Your reporters should not require any direct calls to Thallium's API, but merely be a function of report &rarr; update state &rarr; print (if necessary) &rarr; return. If you feel you need to depend on Thallium's state, you should consider wrapping the reporter in a [plugin](./plugins.md) and exposing that instead.

## Why not event emitters? Why not a class with event handler methods?

I'd like to keep Thallium simple and less opinionated. It's easier to conceptualize a single callback accepting about 10 related types than 10 events, each accepting a different type. If you would like a more real-world comparison of the two styles, [see this gist](https://gist.github.com/isiahmeadows/97239e28a2288f65429c0f58acd0e1c7), which features both styles.

With event emitters in particular, it also enables you to leverage things other than generic callbacks, since your logic is more linear (returning values from event emitters is [rather awkward](http://electron.atom.io/docs/api/ipc-main/) in practice). The return value is a very powerful feature, one that event emitters natively lack.

Also, since large numbers of reporters not handling events (which might be common in Babel) are uncommon here, I don't need to know the structure of a reporter before I add it.

It's easy to wrap the current format, and I've even written utilities to help you out in the case of [event emitters (wrapper)](./examples/ee-reporter.js) and even [observables (plugin)](./examples/observable-reporter.js). There's also CoffeeScript equivalents for each ([event emitters](./examples/ee-reporter.coffee) and [observables](./examples/observable-reporter.coffee)). But functions are still simpler to implement and consume, and the reports passed are pretty similar.
