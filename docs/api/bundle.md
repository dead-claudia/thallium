*[Up](../api.md)*

# Bundle API

The Thallium browser bundle works similarly to the browser API, but it's all in one nicely packaged script ready for use in the browser or wherever, in `thallium.js`. It's tested in browsers and Node, and although untested, it should even work on Rhino or Nashorn (although you'll have to pass some reporter options so you can see the output). Here's an example of a really simple setup:

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

- `tl.t` - The primary API, from `require("thallium")`.
- `tl.assert` - The assertions namespace, from `require("thallium/assert")`.
- `tl.match` - The `match` namespace, from `require("thallium/match")`.
- `tl.r` - Each of the reporters live here. You can find more details on these [here](../reporters.md).
- `tl.r.dot` - The dot reporter, same as `require("thallium/r/dot")`.
- `tl.r.spec` - The spec reporter, same as `require("thallium/r/spec")`.
- `tl.r.tap` - The tap reporter, same as `require("thallium/r/tap")`.
- `tl.root` - `internal.root` from `require("thallium/internal")`
- `tl.reports` - `internal.reports` from `require("thallium/internal")`
- `tl.hookErrors` - `internal.hookErrors` from `require("thallium/internal")`
- `tl.location` - `internal.location` from `require("thallium/internal")`
- `tl.settings` - Various settings to toggle. Each setting has a `setting.get()` and `setting.set(value)` method to get and set the setting, respectively.

    - `tl.settings.windowWidth: number` - The terminal window width as an integer, for reporters.
    - `tl.settings.newline: string` - The newline character to use, for reporters.
    - `tl.settings.symbols: {Pass, Fail, Dot}` - The string symbol to use for each of these, for reporters.
    - `tl.settings.defaultOpts: {print, write, reset}` - The default options to use. See the [reporter options](../reporters.md#options) for more details.
    - `tl.settings.colorSupport: {supported, forced}` - Set the default color support, in case you're using Rhino, Nashorn, etc., and wish to print terminal colors. Note that this is technically unsupported, but I would at least leave the door open for it.

You can also find the definitions for this module in `thallium.d.ts` next to the bundle, in case you're using TypeScript with this.

You can also use `thallium-migrate.js` in the root, which has most of the old API monkey-patched back in with deprecation warnings, to ease test migration. It also re-adds the old `assertions` and `create` functions to the exports.
