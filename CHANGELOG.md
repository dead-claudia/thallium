# Changelog

## v0.3.5

- Check/fix broken TypeScript definitions

## v0.3.4

- Fix unusual error message duplication caused by not trimming them correctly.
- Add OS X/macOS support
- Fix broken TypeScript definitions for the built-in reporter options and the `VoidReporter`/`VoidPlugin` types.
- Retain the default width when the terminal reports a width of zero columns.
- Make errors discernable without color in the `dot` reporter.

## v0.3.3

- Missed other files... :( (Hopefully, I got everything this time)

## v0.3.2

- Missed another file...

## v0.3.1

- Missed a file...

## v0.3.0

Special shout-out to @zubuzon for picking off numerous bugs littered throughout! :smile:

There is a `thallium-migrate.js` bundle and another `thallium/migrate` module to assist in migrating across the many changes. The latter monkey-patches most of the old API back in to `thallium` itself. It doesn't help that this is a far bigger update than what would be typical of a major update, since I pretty much redesigned the core API.

Here's an explanation of what changed:

### Things added

- Most normal test methods also have related `reflect` methods.
- Most reporter environment variables are now configurable in the browser bundles.
- The `assert.closeTo` (was `t.closeTo`) now uses a tolerance instead of a raw difference, and has a sensible default.
- `reflect.isLocked` for checking that a test is locked.
- `reflect.current` to get a `reflect` for the current test.
- The CLI now has a default config, in case you don't have one. It simply registers the spec reporter.
- There now exist proper "before each", "after each", "before all", and "after all" hooks. The first two run on every test, but the last two only run on the test they're defined in.
    - There is now a new `hook` event for when errors occur in these.
    - They have full `reflect` support, including adding, removing, and testing for existence.
- Plugins may now remove reporters. It is not exposed normally because it's very rare for the end user to want to remove a reporter.
- `t.call` is the new plugin factory, and it returns the result of the callback.
- child `reflect` instances now can find their name, index, and children.
- An options file is now optionally accepted by the CLI.
- `thallium/r` now has its own namespace `index.js` module.

### Things changed

- Support for Node pre-4 is now gone.
- Support for PhantomJS 1.x is now gone.
- `reflect` instances are now persistent per-test.
- This now requires a Promise polyfill for environments that don't have it (e.g. PhantomJS).
- All tests are now both async and blocks. You can return a promise that resolves when done for async support.
- The reporter type-checking methods (e.g. `report.start`) are now type-checking getters with somewhat better names (e.g. `report.isStart`).
- The report and location factories are now in `thallium/internal`, with the report constructors in a namespace. The old ones are available after loading `thallium/migrate`.
    - The `hook` events are also available here.
- Most of the properties no longer throw if they're not the "active" test.
    - As a side effect, `reflect.checkInit` is deprecated, but available after loading `thallium/migrate`.
- `t.only`'s filter is now determined at runtime.
- `t.timeout` and `t.slow` are now getter/setter properties.
- `report.value` is now `report.error` across all types.
- Root `reflect` and child `reflect` instances are now of two different types, and don't share all the same methods.
    - You can use `reflect.isRoot` to differentiate these two.
- Reporters may now only be changed at the root, not in children. This includes the new `reflect.reporter` and `reflect.removeReporter` methods.
- The built-in reporters now exclusively use `write`, and no longer use `print`. So `print` is now ignored as an option.
- `t.reporter` is no longer variadic, and now automatically invokes the reporter with the optional second argument. This has no `thallium/migrate` support, because I have no way of checking whether the reporter is the returned function or the factory itself.
- `t.reporter` caches based on the factory now.
- `reflect.reporters` is removed in favor for `reflect.hasReporter`.

### Things removed

These things are deprecated and removed, but the old behavior is available after loading `thallium/migrate`, unless specified otherwise or it being a complete file removal.

- The first parameter of `t.test` is deprecated, and will be removed in 0.4. Just use the global instance now, which also knows when it's in a subtest, and it tracks the current test (available in `reflect.current`) to use, even in subtests.
    - The inheritance entailed by that first argument is similarly deprecated, and will be removed in 0.4.
- The `done` argument for reporters (and associated built-in reporters' options) no longer exists, and it is not available with `thallium/migrate`. Use a promisifying utility instead.
- The built-in reporters no longer accept a `print` method option, and it is not available with `thallium/migrate`. They now exclusively use `write`.
- `t.async` is removed, since `t.test` now itself has async support.
- `t.async`'s `done` callback is deprecated in favor of just using promises.
- `thallium/core` is deprecated, as `thallium` now has most of the rest stripped out.
- `thallium/assertions` is deprecated, and the automatic load when calling `thallium` is removed. Use the independent `thallium/assert` instead
    - The loose deep matching is gone. It was slow, complicated, and hardly useful.
    - Some of the redundant methods were removed. The deprecation warnings can point you to what to move to.
- `t.use` and `t.reflect` are deprecated in favor of `t.call`, which is more flexible, albeit non-caching.
- Inline tests are completely removed, and are not available with `thallium/migrate`. Migrate to block tests before updating.
- Generator test body support is deprecated. Wrap your test with `co`, migrate to async functions, or similar instead.
- `t.do` is deprecated with no need for replacement.
- `bin/thallium` and `bin/_thallium` are both removed entirely. `bin/tl` now respawns itself.
- The `reflect.scheduler` method is removed.
- `reflect.runnable()` and other useless, obsolete checkers are deprecated with no need for replacement.
    - Note that these are named things like `isRunnable` instead in the migration utility. It's an easy find/replace operation.
- The `block` property in reporters is no longer used. If you need that functionality back, use this utility to group a set of reporters:

    ```js
    // This may need translated to ES5, and will only work in Node 6+ and the latest
    // Chrome, Safari, and Firefox.
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
- `report` instances are no longer plain objects, and they no longer have all the properties.

### Other

Many minor bug fixes and improvements. Here's a few of them:

- It doesn't bork up over a global install.
- It handles `.tl.js`/etc. directories and similar (i.e. it exists, but isn't a file) more gracefully.
- Report inspections are a little more helpful now.
- Dropped a couple dependencies, uses Node's internal module resolution directly for `--require`/etc.

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
