*[Up](./README.md)*

# Browser runner

The browser bundle comes with its own runner, complete with script loading and a "Run" button. It's meant to be simple and easy to use, so you can get started very quickly.

![./images/screenshot-dom.png]

Here's how to use it:

```html
<!-- test.html -->
<!DOCTYPE html>
<meta charset="utf-8">
<script src="./node_modules/thallium/thallium.js"></script>
<script>
require("thallium").dom([
    "my-lib/common.js",
    "my-lib/index.js",
    "test/common.js",
    "test/index.js",
    "test/ui.js",
])
.run()
</script>
```

When you first load, and after you click `run`, your files all load in order and automatically, then all your tests run. If you need to expose any globals, or even load jQuery, you can do so, and the globals will be cleared for you each iteration. (It doesn't clean up event listeners for you, so do be aware of that.)

Each of these are run in the global scope, just like any other callback attribute like `onerror`.

## Programmatic API

You can also use it programmatically, and set it up on your own terms.

```html
<!DOCTYPE html>
<meta charset="utf-8">
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

The `tl.dom()` method accepts an optional options object:

- `opts.title` - The title to set for the page, in case you didn't specify one.
- `opts.timeout = 5000` - The timeout for loading each script in milliseconds, defaulting to 5 seconds.
- `opts.files = []` - An optional list of files to load, in loading order.
- `opts.preload` - An optional function to run before each load.
- `opts.prerun` - An optional function to run after each load.
- `opts.postrun` - An optional function to run after each run.
- `opts.error` - A function to run on error, with the error in question being passed as the argument.
- `opts.thallium` - The Thallium instance to use, defaulting to the global one.

If you pass an array object (like in the above example), that is treated as a list for `opts.files`.

`tl.dom()` returns an object two methods:

- `run()` - Run the tests programmatically and return a promise resolved when done. Note that if tests are currently running, it'll return a promise resolved when the *current* run completes.
- `detach()` - Detach the runner programmatically and return a promise resolved when done. The node is cleared, and runner destroyed, so this call is idempotent, and `run` will always throw.

## Further information

- This also includes the relevant CSS within the script, and it's injected into the `<head>`. You don't need to load a separate stylesheet, as it's already there.
- This mounts onto a `<div id="tl"></div>` element, adding one for you if it doesn't already exist.
- It doesn't require a full display to work, nor even a fully functional CSS implementation. It is actively tested with a mock DOM with zero CSS awareness, so it will work even with JSDOM, if you need it.
- If you wish to access it directly in Browserify, nw.js, or Electron, `tl.dom` is also available as `thallium/dom`.
