# Contributing

Did you run into issues? Great! Tell me [here](http://github.com/isiahmeadows/thallium/issues/new) and I'll see how I can help you.

Do you want to contribute code? First, I'd like to thank you in advance for your contribution. I'll take any help I can get.

## Process Overview

Here's an overview of the high level contributing process.

*Obligatory disclaimer: By contributing to this project, you agree to make available any and all code submitted under the ISC License and/or other relevant licenses.*

### Setup

1. Install Node and npm. You can find installers and instructions [here](https://nodejs.org/en/download/), or if you use Linux, look [here](https://nodejs.org/en/download/package-manager/) instead.
    - Note that if you're using Windows, you need to ensure during setup that it also installs both `node` and `npm` onto your PATH.
2. Install [Git](https://git-scm.com/). You'll need this to clone the source.
    - Note that if you're using Windows, you need to ensure during setup that it also installs `git` onto your PATH.
3. [Fork this repo](https://help.github.com/articles/fork-a-repo/).
4. Run `git clone https://github.com/<your-github-username>/thallium.git` to get the source and link it to your GitHub account.
5. Run `cd thallium` to enter that directory, so the rest of the commands work.
6. Run `git remote add upstream https://github.com/isiahmeadows/thallium.git` to set the upstream URL.
7. Create a new branch with `git checkout -b <some-branch>`.
8. Hack away, and fix whatever you need to. Don't forget to add tests for anything that was fixed.

### Sync with this repository

If you ever need to sync your fork/branch with upstream, do this:

1. Run `git pull upstream master`.
2. If it prompts you to make a merge commit, just save the file as-is.
3. If it prompts you to resolve a merge conflict, that means you need to manually edit some of the files so Git knows what actually changed.

### Submitting your contribution

Once you're ready to submit your changes, do this:

1. If you're fixing something, make sure your fix is tested. Otherwise, you're not quite ready to submit them.
2. Make sure your tests pass locally. This will make my life and your life much easier.
    - If you don't know why something is failing, feel free to submit it anyways, so I can help you out.
3. Run `git commit`. This will bring up an editor so you can describe your changes.
4. Run `git push -u origin <some-branch>` to sync your new branch with the upstream repository. The branch name must match the one you initially created.
5. On GitHub, select the branch you just sync'd, and [open a pull request](https://help.github.com/articles/creating-a-pull-request/). I'll take a look at it and work with you to ensure it works as well as possible.

## Developing your patch

Here's some information and utilities to help you out in hacking on this project.

### Common tasks

I have a make script to assist in most of the common tasks.

- `node make` - Lint and test everything.
- `node make lint` - Lint everything (with ESLint and CoffeeLint).
- `node make test` - Run all the tests once in the system version of Node and in Chrome.
- `node make watch` - Do the above, but also run them all on each file change.
- `node make test:chrome` - Run all the tests in Chrome only.
- `node make test:node` - Run all the tests in Node only.
- `node make watch:chrome` - Run all the tests in Chrome only on each file change.
- `node make watch:node` - Run all the tests in Node only on each file change.

I personally frequently use `node make watch:node` when working on this, so I have relatively quick feedback on how ready my work is.

### Runtime Support

This is tested in [Travis CI](https://travis-ci.org/isiahmeadows/thallium) on Ubuntu against the following runtimes:

- Node 4 and later on Windows, Linux (Ubuntu), and OS X
- PhantomJS 2 on Windows, Linux (Ubuntu), and OS X
- Chrome Stable on Linux (Ubuntu)
- Firefox Stable, ESR, and Beta on Linux (Ubuntu)

For similar reasons, this is written in pure ES5 due to compatibility concerns. Some features still need polyfilled for older browsers, and the way this is written doesn't really need many ES6 features. See the tips and tricks later on for some workarounds I've created for this.

### Documentation

The code within the documentation and examples generally use anything stage 4 or later, including all the ES6 things like modules and arrow functions, and other very new, recently added features like async functions.

Note that I don't actually test the documentation's code, but please ensure it otherwise matches the code style elsewhere, and that it is actually correct.

### Code organization

- `bin` - The executables live here. Note that the binaries should also be directly linked to from the `package.json`.

- `r` - The home of all reporters. Nothing goes here except for reporter modules part of the public API.

- `lib` - The core of this project. Many public API modules are just thin wrappers for something in here, including the main export.

- `lib/api` - The core API. Both the primary `t` and `reflect` APIs are defined here.

- `lib/core` - The core test state and execution logic. Handle with care, since it's probably the most heavily used. Bugs in this can and often will affect seemingly unrelated tests. Also, the report types are defined here.

- `lib/cli` - This contains 90% of the logic for the CLI. Dependency injection is heavily used so I don't have to create dozens of file system fixtures and use `proxyquire` extensively.

- `lib/reporter` - This contains common logic for the reporters.

- `lib/replaced` - This contains anything replaced going from Node to Browserify.

- `docs` - The documentation for this project, 100% Markdown.

- `docs/examples` - This contains several examples of various things.

- `migrate` - This contains all the code shimming most of the old behavior where applicable.

- `test` - This contains all the tests. Mocha is currently used as the test runner, and the assertions are fully self-hosted. Using Thallium to test Thallium is awesome!

- `fixtures` - This contains the fixtures for the various tests.
    - Some of the `test` files are mirrored in [CoffeeScript](http://coffeescript.org/) within `fixtures/large-coffee` to help aid in more real-world usage. These are very explicitly and clearly labeled on the top, so it should be very hard to miss if you're looking at those files.

- `scripts` - This contains various development scripts. It's generally uninteresting unless you like looking at shell scripts.

- `test-util` - This contains various test-related utilities, including the mocks. Here's a few globals exported from `test-util/globals` you might appreciate knowing about:

    - `t.reporter(Util.push, array | {ret: array, keep = false})` - A Thallium reporter that accepts an array destination to push its reports into. Use the second form, with `keep` set to `true`, if you want to retain the original `duration` and `slow` speeds.
    - `Util.n.*` - Create a report node of a given type.
    - `Util.p(name, index)` - Create a path node with a given name and index.

    These are most frequently used for testing reporter output for whatever reason, and the latter two are usually locally aliased.

### Code style

- This is linted with ESLint, and uses my [`isiahmeadows/commonjs` preset](https://npmjs.com/package/eslint-config-isiahmeadows) for the main code base and `isiahmeadows/es6` for the examples.

- [CoffeeLint](http://www.coffeelint.org/) is used to lint the few CoffeeScript files littered around, mostly there for testing and examples.

- When requiring a file, don't include the extension or `/index`, except for explicitly `./index` and `../index` (which avoids an ambiguity with Node, and `./.` is not very obvious). It also helps keep the `require` calls a little cleaner.

- Classes are used, but mostly as C-like structs. Inheritance is minimized. They are usually used for ADTs and grouping state, and functions are preferred for callbacks and one-off things that don't involve delaying execution.

- File names are lower cased, and namespaces are capitalized like constructors, except for ones imported from Node builtins and ones treated as values.

- `exports.foo = bar` is preferred over `module.exports.foo = bar`, but default exports like `module.exports = foo` are okay, as long as that's the only thing exported.

- Named exports are also preferred to static members on default exports. For example:

    ```js
    // Good
    exports.Test = Test
    function Test(name, index) {
        this.name = name
        this.index = index
    }

    exports.timeout = function (test) {
        while (!test.timeout && test.root !== test) {
            test = test.parent
        }

        return test.timeout || 2000 // ms - default timeout
    }

    // Bad
    module.exports = Test
    function Test(name, index) {
        this.name = name
        this.index = index
    }

    Test.timeout = function (test) {
        while (!test.timeout && test.root !== test) {
            test = test.parent
        }

        return test.timeout || 2000 // ms - default timeout
    }
    ```

- All non-deterministic tests/groups of tests are suffixed with `(FLAKE)`. This includes part of one of the end-to-end fixtures. This helps me know at a glance whether rerunning it is an option, since they might fail even when working otherwise as intended (e.g. a timer taking 20 milliseconds longer than expected, or a `readdir` returning files in a different order than usual).

### Tips and idioms

- I use ES6 promises extensively, because it makes the code so much easier to handle.

- There is a class-ish `methods` ~~swiss army knife~~ helper [here](http://github.com/isiahmeadows/thallium/blob/master/lib/methods.js) which is used throughout. This is one of the main reasons why I don't really need ES6 beyond promises - it even handles inheritance and non-enumerability of methods. It's used to define the API, simplify the internal DSL for the core reporters, and decouple script loading in the CLI. The [report types](http://github.com/isiahmeadows/thallium/blob/master/lib/core/reports.js) are a good example on how this can be used, since it covers most ways you can use this. Don't overuse it, though, mainly because ESLint doesn't catch undefined properties, and object oriented code itself often drives up the boilerplate unnecessarily.

- Lazy iteration of a list can be done by taking a callback and calling it when you're ready with a value. This is done in one of the functions in [the arguments parser](http://github.com/isiahmeadows/thallium/blob/master/lib/methods.js):

    ```js
    /**
     * Serializes `argv` into a list of tokens.
     */
    function serialize(argv, call) {
        var boolean = true

        for (var i = 0; i < argv.length; i++) {
            var entry = argv[i]

            if (entry === "--") {
                // Delegate to another function by passing the `call` parameter.
                serializeRest(boolean, argv, i + 1, call)
                break
            }

            if (!boolean || entry[0] !== "-") {
                // Yield a value.
                call({type: "value", value: entry, boolean: boolean})
                boolean = true
                continue
            }

            // etc.
        }
    }
    ```

- If you need an equivalent of `for ... of` to iterate things like `Map` or `Set`:

    ```js
    var iter = coll.values()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        var value = next.value
        // do things...
    }
    ```

- If you're on Linux and have [`nvm`](https://github.com/creationix/nvm) installed, there's a little `scripts/test.sh` script in the root you can run, which will test everything Travis will on your local machine, installing versions that don't exist if necessary. Note that it doesn't actually update existing installations for you, though. It's not quite *that* magical, and I don't suspect you'd want that, either.

- For the tests, feel free to use the framework's own plugin and reporter system to your advantage to simplify your testing. They are very well tested, and if any of the assertions or plugin/reporter APIs break, you'll know it immediately. For example, I used [`t.reporter`](./docs/reporter-api.md) with the `t.match` assertion to test the reporter output throughout the tests. Here's a modified example from one of the tests:

    ```js
    var tt = t.create()
    var ret = []

    tt.reporter(Util.push, ret)

    tt.test("test", function () {})
    tt.test("test", function () {})

    return tt.run().then(function () {
        t.match(ret, [
            n("start", [])
            n("start", [p("test", 0)])
            n("end", [p("test", 0)])
            n("pass", [p("test", 0)])
            n("start", [p("test", 1)])
            n("end", [p("test", 1)])
            n("pass", [p("test", 1)])
            n("end", [])
            n("exit", [])
        ])
    })
    ```
