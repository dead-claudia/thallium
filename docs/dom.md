*[Up](./README.md)*

# Browser runner

The browser bundle comes with its own runner, complete with script loading and a "Run" button. It's meant to be simple and easy to use, so you can get started very quickly. Here's how to use it:

```html
<!-- test.html -->
<!DOCTYPE html>
<meta charset="utf-8">
<!-- Thallium requires a Promise polyfill -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/native-promise-only/0.8.1/npo.js"></script>
<script src="./node_modules/thallium/thallium.js"
    data-files="
        my-lib/common.js
        my-lib/index.js
        test/common.js
        test/index.js
        test/ui.js
    "
></script>
```

It's as simple as including a `data-files` attribute containing all your dependencies, files, then tests as a space-separated list. When you first load, and after you click `run`, your files all load in order and automatically, then all your tests run. If you need to expose any globals, or even load jQuery, you can do so, and the globals will be cleared for you each iteration. (It doesn't clean up event listeners for you, so do be aware of that.)

When this is run automatically, it'll alias `require("thallium").t` as `t` and `require("thallium").assert` as `assert` for you, so you don't have to yourself.

If you need further customization and/or cleanup, here's a few other attributes you can set:

- `data-timeout` - If your files normally take longer than 2 seconds to load (e.g. loading them from a super slow connection), then you can use this to change that timeout, so it doesn't complain and bail early.

- `data-preload` - This is run before loading any files, so you can do whatever you need to prepare for that. If you need to, you can return a thenable in case you need to wait for something async.

- `data-prerun` - This is run after all the files are loaded, before running the tests, so if you need to do anything there, then's a good time. If you need to, you can return a thenable in case you need to wait for something async.

- `data-postrun` - This is run after all tests are run, before globals are cleaned up, so if you need to do any extra cleanup, here's where you do it. If you need to, you can return a thenable in case you need to wait for something async.

- `data-error` - This is run on any error that occurs, and `err` within it is the error that occurred. If it's a script loading error or similar, it will be a DOM `error` event, or if some variable was not defined, it'll be a `ReferenceError` instead. If you need to, you can return a thenable in case you need to wait for something async.

Each of these are run in the global scope, just like any other callback attribute like `onerror`.

## Programmatic API

You can also use it programmatically, and set it up on your own terms.

```html
<!DOCTYPE html>
<meta charset="utf-8">
<!-- Thallium requires a Promise polyfill -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/native-promise-only/0.8.1/npo.js"></script>
<script src="./node_modules/thallium/thallium.js"></script>
<script>
var dom = require("thallium").dom([
    "my-lib/common.js",
    "my-lib/index.js",
    "test/common.js",
    "test/index.js",
    "test/ui.js",
])

dom.run().then(function () {
    // tests run...
})
</script>
```

The `tl.dom()` method accepts an optional options object, similar to the `data-*` attributes above:

- `opts.title` - The title to set for the page, in case you didn't specify one.
- `opts.timeout = 2000` - The timeout for loading each script.
- `opts.files = []` - The files to load, in loading order. Unlike `data-files`, this is fully optional, and defaults to no files being loaded.
- `opts.preload` - An optional function to run before each load.
- `opts.prerun` - An optional function to run after each load.
- `opts.postrun` - An optional function to run after each run.
- `opts.error` - A function to run on error, with the error in question being passed as the argument.
- `opts.thallium` - The Thallium instance to use, defaulting to the global one.

If you pass an array object (like in the above example), that is treated as a list for `opts.files`.

`tl.dom()` returns an object with a `run()` method that you may call to run the tests. That returns a promise resolved when done.

## Further information

- This also includes the relevant CSS within the script, and it's injected into the `<head>`. You don't need to load a separate stylesheet, as it's already there.
- This mounts onto a `<div id="tl"></div>` element, searching for the ID. If one already exists, it's cleared first before appending to it, but if no such element exists, it's added automatically for you.
- It doesn't require a full display to work, nor even a fully functional CSS implementation. It is actively tested with a mock DOM with zero CSS awareness, so it will work even with JSDOM, if you need it.
- It waits for the page to load before mounting when auto-loaded via `data-files`.
- If you wish to access it directly in Browserify, nw.js, or Electron, `tl.dom` is also available as `thallium/dom`.
