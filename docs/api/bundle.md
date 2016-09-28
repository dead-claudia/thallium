*[Up](../api.md)*

# Bundle API

The Thallium browser bundle works similarly to the browser API, but it's all in one nicely packaged script ready for use in the browser or wherever. It's tested in browsers and Node, and although untested, it should even work on Rhino or Nashorn (although you'll have to pass some reporter options so you can see the output). Here's an example of a really simple setup:

```html
<!DOCTYPE html>
<title>Thallium Tests</title>
<script src="./node_modules/thallium/thallium.js"></script>
<script>
// Load the bundle
var tl = require("thallium")
var t = tl.t

// Print the results to the console with the spec reporter.
t.reporter(tl.r.spec())
</script>

<!-- Load your tests -->
<script src="tests.js"></script>

<!-- Run your tests, and log errors to the console -->
<script>t.run()</script>
```

Remember that these are all using the same APIs. You can even do things like format the output for color (which isn't supported directly in the console):

```html
<!DOCTYPE html>
<title>Thallium Tests</title>
<script src="./node_modules/thallium/thallium.js"></script>
<script src="https://wzrd.in/standalone/ansi_up@latest"></script>
<pre><code id="output"></code></pre>
<script>
var tl = require("thallium")
var t = tl.t

t.use(function (t) {
    var ansi_up = require("ansi_up")
    var elem = document.getElementById("output")

    t.reporter(tl.r.spec({
        print: function (line, callback) {
            elem.innerHTML += ansi_up.ansi_to_html(line)
            return callback()
        },

        reset: function (line, callback) {
            elem.innerHTML = ""
            return callback()
        },
    }))
})
</script>

<script src="tests.js"></script>
<script>t.run()</script>
```

## API Details

- `tl.t` - The main module export. This is equivalent to the normal `require("thallium")` in Node, with the [primary API](./thallium.md) and [assertions](../assertions.md) loaded.
- `tl.create()` - A shorthand for [`t.base`](./thallium.md#base) to create a new instance.
- `tl.r` - Each of the reporters live here. You can find more details on these [here](../reporters.md).
- `tl.r.dot` - The dot reporter, same as `require("thallium/r/dot")`.
- `tl.r.spec` - The spec reporter, same as `require("thallium/r/spec")`.
- `tl.r.tap` - The tap reporter, same as `require("thallium/r/tap")`.
- `tl.colorSupport({supported, forced})` - In case, for some reason, you're running it in something like Rhino or Nashorn, which supports colors by default. In this case, you may also probably want to pass appropriate options to the reporters as well, but especially if the environment is configurable (e.g. you've created your own CLI), you'll want to set this.

You can also find the definitions for this module in `thallium.d.ts` next to the bundle, in case you're using TypeScript with this. Here are a couple specific notes for that:

- The interfaces for `tl.r.dot`, `tl.r.spec`, etc. are exported respectively in `tl.r.Dot`, `tl.r.Spec`, etc. The difference is because of the default export, which I didn't want to export as `tl.r.dot.default`.
- The `Test` interface from the `thallium/core` interfaces is exported as `CoreTest`.
