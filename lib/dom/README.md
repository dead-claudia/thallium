# The DOM reporter and loader

Yes, this actually includes a script loader and CSS injection on top of everything else, so you only need 1-2 script elements. If you don't already have a `<div id="tl"></div>`, it's automatically added for you.

Options:

- `opts.title` - The title to set for the page.
- `opts.timeout = 2000` - The timeout for loading each script.
- `opts.files = []` - The files to load, in loading order.
- `opts.preload` - An optional function to run before each load.
- `opts.prerun` - An optional function to run after each load.
- `opts.postrun` - An optional function to run after each run.
- `opts.error` - A function to run on error.
- `opts.thallium` - The Thallium instance to use, defaults to the global one.

And as a shorthand, no `opts` implies the default opts, and if you pass an
array of files, that's also okay.

<!-- Commented out pending update -->
<!--
Also, you can run them by specifying them as `data-*` attributes, as done in
the basic usage. You need a minimum of `data-files` to run anything, but the
rest work, too.

- `data-files` - A space-separated list of files (line breaks are allowed).
- `data-timeout` - The timeout as an integer, with the same default.
- `data-preload` - An optional `opts.preload` function body.
- `data-prerun` - An optional `opts.prerun` function body.
- `data-postrun` - An optional `opts.postrun` function body.
- `data-error` - An optional `opts.error` function body.

Note that `data-*` callbacks are run in the global scope, and that
`data-error` is called with a single `err` argument.
-->

## Implementation notes

Note: do *not* assume the DOM is ready, or even that one even exists, because both the tests and users may need to load mocks before initializing this reporter.
