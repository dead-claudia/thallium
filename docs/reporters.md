# Reporters

Thallium comes with a few built-in reporters, but currently, they are a work in progress. At the time of writing, there are two reporters finished, but there are more to come:

- `thallium/r/tap` - A [TAP-compatible](https://testanything.org) reporter, for you to use with various tools.
- `thallium/r/spec` - A reporter modeled very closely to Mocha's default `spec` reporter.
- `thallium/r/dot` - A reporter modeled very closely to Mocha's default `dot` reporter.

Each built-in reporter must be called like so, and if you don't, you'll get reminded with an error:

```js
// Note the function call of the default export.
t.reporter(require("thallium/r/spec")())
```

If you are interested in writing your own, consult the reporter API [here](./reporter-api.md)

## Options

Each reporter accepts an optional options object as its sole argument, so you may change how the output is printed. Do note that the width of the output for console reporters is dependent on the terminal height and width, or 75 if it's not. Here are the options accepted by each reporter.

### `thallium/r/tap`

Note that this will never output terminal color escapes.

- `print(line, callback?)`

    This is called with each line for the results, and must either call the callback when done or return a thenable that resolves when done.

- `reset(callback?)`

    This is called at the end of the stream, after all events are processed, and must either call the callback when done or return a thenable that resolves when done. If you can support multiple runs, this is where you reset the state so it can run everything again with a clean slate.

    If `print` is passed, this is also required.

### `thallium/r/spec`

- `print(line, callback?)`

    This is called with each line for the results, and must either call the callback when done or return a thenable that resolves when done.

- `reset(callback?)`

    This is called at the end of the stream, after all events are processed, and must either call the callback when done or return a thenable that resolves when done. If you can support multiple runs, this is where you reset the state so it can run everything again with a clean slate.

    If `print` is passed, this is also required.

- `color`

    A boolean for whether to use terminal color escapes in the output, regardless of whether the output is a terminal or not. Note that `--color` and `--no-color` on the command line and the environment variables `FORCE_COLOR` and `FORCE_NO_COLOR` take precedence over this.

Note that for `dot` and `spec`, if terminal colors are on by default, they may be forced off with `--no-color` or on with `--color` via the command line as well, and this will override the `color` argument.

### `thallium/r/dot`

Note that if you provide `print` or `write`, you *must* provide both, or you won't get the complete output, and the output you do get is completely undefined.

- `print(line, callback?)`

    This is called with each line for the results, and must either call the callback when done or return a thenable that resolves when done.

- `write(string, callback?)`

    This is called once for each dot or line break, and must either call the callback when done or return a thenable that resolves when done.

- `reset(callback?)`

    This is called at the end of the stream, after all events are processed, and must either call the callback when done or return a thenable that resolves when done. If you can support multiple runs, this is where you reset the state so it can run everything again with a clean slate.

    If `print` and `write` are passed, this is also required.

- `color`

    A boolean for whether to use terminal color escapes in the output, regardless of whether the output is a terminal or not. Note that `--color` and `--no-color` on the command line and the environment variables `FORCE_COLOR` and `FORCE_NO_COLOR` take precedence over this.
