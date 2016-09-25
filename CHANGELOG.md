# Changelog

## v0.2.10

- `thallium/thallium.js` is now correctly published...

## v0.2.9

- `t.matchLoose`, `t.deepEqualLoose`, and friends now removed due to lack of use case.
- Deep equality algorithm is much faster now.
- Expando properties on arrays/RegExps/etc. are no longer checked. This will no longer throw:
    ```js
    var re = /foo/g
    re.foo = "bar"
    t.match(re, /foo/g)
    ```
- Several issues with deep equality algorithm fixed:
    - Typed arrays, DataViews, and ArrayBuffers are fully supported
    - This now throws as expected: `t.match(new Error("foo"), {message: "foo"})`
    - This now throws as expected: `t.match(new Error("foo"), new TypeError("foo"))`
    - Errors are compared with their prototypes checked to be equal, like what `t.deepEqual` does normally.
- ES2018 async functions now used in docs/examples/tap-reporter.js
- Examples cleaned up a little.
- Reporters and the CLI should now be less broken on Windows, as those no longer use raw newlines.
- The CLI is significantly faster while loading the config and `--require` stuff.

## v0.2.8

- Deep equality algorithm now checks correct set of keys for thrown vs unthrown errors.

## v0.2.7

- Cycles are now detected in the deep equality assertions
- RegExps are now checked in the deep equality assertions
- Deep equality algorithm cleaned up

## v0.2.6

- Fix config resolution bug when custom `config.files` is used.
- Fix errors when `util.inspect`ing reports.
- Globs won't bork over directories.
- Things like `--require mod.foo:foo/register-module --require foo:foo/register` will now work as expected.
- Some internal refactoring.

## v0.2.5

- Don't warn about inline tests containing just child tests.
- Use fresh Bluebird copy
- Don't depend on `diff` (for now)
- Optimize dependencies a little.

## v0.2.3

Bug fixes in the built-in reporters

## v0.2.2

Fixing more npm mistakes... :-(

## v0.2.1

Forgot to update package.json...

## v0.2.0

- Make `t.throws` errors make more sense.
- Make reporter API more concise.
- Restructure internals a bit.
- Add `reflect.report`, `reflect.loc`, and `reflect.extra`. Note that location objects and extra call data objects are now instances you can create from this call. If you use `t.deepEqual`/`t.notDeepEqual` to test these, you need to use this instead of plain objects.

The reporter event API has changed significantly. Previously, it used a `type` property to dictate its type, but it now has the following methods:

- `ev.type()` - What used to be `ev.type`, and is here for cases when you need to pretty-print the event type name.
- `ev.start()`, `ev.enter()`, `ev.leave()`, `ev.pass()`, `ev.fail()`, `ev.skip()`, `ev.end()`, `ev.error()`, and `ev.extra()` - Easier, faster, and new preferred way to check types. They check the type of their namesake (e.g. `ev.start()` tests if the event is a start event).
- It also implements `ev.inspect()` for a more useful output for `util.inspect`, where you'd otherwise get an unhelpful arbitrary integer that the type is based on and useless garbage for some events (i.e. `start` events don't have a useful `value`, `duration`, or `slow`).

## v0.1.4

- Add browser support
- Add browser bundle (works in Node as well)
- Clean up several implementation details
- Don't set the timeout if an async test fails synchronously

## v0.1.3

Infinite loop fix (caught shortly after last publish)

## v0.1.2

Fix type-related bug regarding skipped tests.

## v0.1.1

Fixed outdated `--help(-detailed)` output.

## v0.1.0

Initial alpha release

I know [there were some releases prior](https://github.com/isiahmeadows/thallium/releases/tag/v0.0.22), but I wouldn't have even trusted them with toy projects. They were too unstable, and there was *way* too much churn under the hood.
