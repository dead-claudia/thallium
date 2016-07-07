# Changelog

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
