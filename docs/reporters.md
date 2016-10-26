# Reporters

Thallium comes with a few built-in reporters, but currently, they are a work in progress. At the time of writing, there are two reporters finished, but there are more to come:

- `thallium/r/tap` - A [TAP-compatible](https://testanything.org) reporter, for you to use with various tools. Note that this never emits terminal colors.
- `thallium/r/spec` - A reporter modeled very closely to Mocha's default `spec` reporter.
- `thallium/r/dot` - A reporter modeled very closely to Mocha's default `dot` reporter.

Each built-in reporter must be called like so, and if you don't, you'll get reminded with an error:

```js
var spec = require("thallium/r/spec")

// Note the function call
t.reporter(spec())
```

If you are interested in writing your own, consult the reporter API [here](./reporter-api.md)

## Options

Each reporter accepts an optional options object as its sole argument, so you may change how the output is printed. Do note that the width of the output for console reporters is dependent on the terminal height and width, or 75 if it's not. Here are the options accepted by each reporter.

Here's a summary of the available options used across reporters (some reporters only support some of these options):

- `write(string)`

    This is called with a string to print to the console, with newlines already normalized to the platform, and you may return a thenable that resolves when done.

- `reset()`

    This is called at the end of the stream, after all events are processed, and you may return a thenable that resolves when done. If you can support multiple runs, this is where you reset the state so it can run everything again with a clean slate.

- `color`

    A boolean for whether to use terminal color escapes in the output, regardless of whether the output is a terminal or not. Note that `--color` and `--no-color` on the command line and the environment variables `FORCE_COLOR` and `FORCE_NO_COLOR` take precedence over this.

Note that for reporters that accept both `print` and `write`, you *have* to provide either neither or both, or you won't get the complete output, and the output you do get is completely undefined. Also, if you provide `print` and/or `write`, you must also pass `reset`.

Here's what options the reporters themselves accept:

- `thallium/r/tap` - `write(line)` and `reset()`
- `thallium/r/spec` - `write(line)`, `reset()`, and `color`
- `thallium/r/dot` - `write(string)`, `reset()`, and `color`
