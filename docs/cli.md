# CLI

You can run your tests very easily through the CLI. If all your tests are in `test/**/*.js`, it's as easy as this:

```sh
tl
```

If your files are in another directory, or even mixed in with your module's files, you can specify these as well, with one or more [globs](http://npm.im/glob):

```sh
# Many people prefer having this structure instead
tl src/**/*.spec.js
```

If you want to run everything except for a specific directory, you can do that, too, with simple glob negation:

```sh
tl test/**/*.js !test/failing/**
```

If you need to run Thallium in a specific directory, you can use `--cwd`, and all other arguments are resolved relative to this directory, including `--require` and file globs.

This framework, unlike most test frameworks, emphasizes code and convention over configuration. It has some helpful defaults to help you get started, and it has the options to stretch however you need it to. If the default conventions of `.tl.js` in your `test` directory doesn't work, you can change that with ease. If you need to ignore certain files, it's a simple negative glob.

## Configuration

You may also include a config file, named `.tl.js` in either your test directory (if it's not in `test`, you'll need to specify a glob at the CLI) or the project root.

This file is loaded via `require` automatically, no extra flags or anything, and it is all executed code. This module may optionally default-export an object of the following items, or a thenable to it. Note that if you're using ES6 modules that transpile `export default {}` to `exports.default = {}`, that is also honored as a default export, and handled accordingly.

```js
// Your .tl.js, with default values
"use strict"

module.exports = {
    /**
     * This tells Thallium what module, in case you're using some sort of
     * wrapper for it.
     */
    thallium: require("thallium"),

    /**
     * This gives Thallium one or more globs (it can be an array of them) to use
     * to find and load test files, relative to the config itself. Note that
     * this intentionally does not match dot files unless you explicitly specify
     * one, because Thallium, among others like ESLint, will use those for
     * various reasons. It uses node-glob under the hood, but it also supports
     * negation in the same way as the CLI.
     */
    files: "test/**/*.js",
}
```

From here, you may use global plugins, global reporters, or even instantiate a connection to a remote server. The file is literally executed as code, so you may put anything you want on it.

```js
// Your .tl.js
const t = require("thallium")

t.reporter(require("my-reporter")())
t.use(require("my-thallium-integration")())
```

This config is searched for from the bottom of the glob's parent all the way to the root, so if you specify a glob of `test/**/*.js` from inside a `/home/my-name/projects/module`, Thallium will still be able to find a config all the way at `projects/.tl.js`, if it can't find one at `projects/module/test/.tl.js` or `projects/module/.tl.js`.

If you would instead prefer to use another file, or if it's against your religion to use `.tl.js`, there is a command line flag for that:

```sh
tl --config ../shared/tl.js
```

## Loading modules

If you need to load a module before running the tests, it's very simple. Just `require` it within the config itself. For example, if, for some reason, you want to use should.js for assertions instead of Thallium's, you can do it right there.

```js
// .tl.js
"use strict"

const t = require("thallium")

require("should")
t.reporter(require("thallium/r/spec")())
```

If you need to require something before even the config is loaded, like if you need to load a specific environment for your config in a complex CI scenario, or if you just need to shim something within `require` that may affect how your config is loaded, you can use the `--require` flag.

```sh
tl --require ./load-env.js tests/**/*.js
```

In the event this module does asynchronous work, you can also default-export a thenable that resolves when you're done. This will block all further loading until the module finishes, so make sure it does resolve eventually.

## Transpilers

You may use any transpiler you please. For many popular transpilers and compiled languages, such as Babel, TypeScript, and CoffeeScript, you can simply use a `.tl.babel.js` or `.tl.coffee`, respectively, and Thallium will figure out that on its own and use that. The above config could also be expressed as this:

```coffee
module.exports =
    thallium: require 'thallium'
    files: 'test/**/*.coffee'
```

Any language whose extension is already known to be a JS variant by [interpret](http://npm.im/interpret) will be found, and `.babel.js` won't be confused with plain `.js`. This means that even some of the less well known variants like [Wisp (`.wisp`)](http://npm.im/wisp) and [Earl Grey (`.eg`)](https://npm.im/earlgrey) will also be detected.

If you have your own custom in-house language you want to use, that isn't known to `interpret`, or you have a custom `require` wrapper for Babel or whatever to set specific options, you can use that, too. You can specify that on the command line, with very simple syntax.

```sh
tl --require what:@company/what-lang
```

Alternatively, the extension may also be inferred from the glob. So, this will try to load CoffeeScript's hook:

```sh
tl tests/**/*.coffee
```

This is useful if you only have one file, and you can include your reporters and plugins in the same file as your tests, and then it's a single command to run everything: `tl test.coffee`.

Notes:

1. You have to already have the transpiler installed, like [`coffee-script`](http://npm.im/coffee-script) for [CoffeeScript](https://coffeescript.org) or [`ts-node`](http://npm.im/ts-node) and [`typescript`](http://npm.im/typescript) for [TypeScript](https://typescriptlang.com).
2. Plain JavaScript config files take precedence over transpiled configs, so `.tl.js` will be found before `.tl.coffee` or `.tl.babel.js`.
