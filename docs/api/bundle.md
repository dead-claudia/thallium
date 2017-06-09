*[Up](../api.md)*

# Bundle API

The Thallium browser bundle works similarly to the browser API, but it's all in one nicely packaged script ready for use in the browser or wherever, in `thallium.js`. It's tested in browsers and Node, and although untested, it should even work on Rhino or Nashorn (although you'll have to pass some reporter options so you can see the output). Here's an example of a really simple setup for the browser:

```html
<!DOCTYPE html>
<!-- Load the bundle and your tests -->
<script
    src="./node_modules/thallium/thallium.js"
    data-files="tests.js"
></script>
```

In Nashorn, you could do similar to what you would do in Node, taking advantage of the fact all reporters are already available:

```js
load("thallium.js")

// Print the results to the console with the spec reporter.
t.reporter = ["spec", {
    // If nothing has printed yet, don't print a newline afterwards.
    lastIsNewline: true,
    out: java.lang.System.out,

    write: function (str) {
        this.lastIsNewline = str[str.length - 1] !== "\n"
        this.out.print(str)
    },

    reset: function () {
        if (!this.lastIsNewline) {
            this.lastIsNewline = true
            this.out.println()
        }
    },
}]

// Load your tests
load("tests.js")

// Run your tests, and log errors to the console
t.run()
```

## API Details

- `t` - The primary API, from `require("thallium")`.
- `assert` - The assertions namespace, from `require("clean-assert")`.
- `t.dom` - The DOM runner's programmatic API. You can find more details on that [here](../dom.md).
- `t.r` - Each of the reporters live here. You can find more details on these [here](../reporters.md).
- `t.r.dot` - The dot reporter, same as `require("thallium/r/dot")`.
- `t.r.spec` - The spec reporter, same as `require("thallium/r/spec")`.
- `t.r.tap` - The tap reporter, same as `require("thallium/r/tap")`.
- `t.internal` - The internal types, same as `require("thallium/internal")`
- `t.console` - Various console settings to toggle, exposed as properties.

    - `t.console.windowWidth: number` - The terminal window width as an integer, for reporters.
    - `t.console.newline: string` - The newline character to use, for reporters.
    - `t.console.symbols: {Pass, Fail, Dot}` - The string symbol to use for each of these, for reporters.
    - `t.console.defaults: {print, write, reset}` - The default options to use. See the [reporter options](../reporters.md#options) for more details.
    - `t.console.colorSupport: {supported, forced}` - Set the default color support, in case you're using Rhino, Nashorn, etc., and wish to print terminal colors. Note that this is technically unsupported, but I would at least leave the door open for it.

You can also find the definitions for this module in `thallium.d.ts` next to the bundle, in case you're using TypeScript with this.

You can also use `thallium-migrate.js` in the root, which has most of the old API monkey-patched back in with deprecation warnings, to ease test migration. It also exports `thallium/migrate/support` via `t.support`.
