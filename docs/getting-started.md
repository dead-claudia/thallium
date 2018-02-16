*[Up](./README.md)*

# Getting Started

Thallium is designed to be easy to get started with. But before we continue, there's two things you need to do:

1. Ensure you have [Node.js and npm](https://nodejs.org/) installed. Also, when you install, ensure that it adds the relevant entries to your `$PATH` (or `%PATH%` in Windows).

2. In a terminal (or Command Prompt if you're in Windows), run the following commands:

    ```sh
    # If you're in Windows, use forward slashes (`\`) for the path.
    cd path/to/your/project

    npm install --global thallium   # Install Thallium's `tl` command globally
    npm install --save-dev thallium # Install Thallium locally
    ```

In the future, you may find yourself needing to upgrade Thallium. It's pretty simple, and if you encounter other packages, it's pretty similar.

```sh
npm update --global thallium    # To update your global `tl`.
npm update --save-dev thallium  # To update your local Thallium.
```

If you prefer [Yarn](https://yarnpkg.com/) and feel left out, that's okay. You can use that instead. [Installation is similar](https://yarnpkg.com/docs/install), if you don't already have it set up, and of course, the commands are similar.

```sh
# If you're in Windows, use forward slashes (`\`) for the path.
cd path/to/your/project

# To install
yarn global add thallium # Install Thallium's `tl` globally
yarn add thallium        # Install Thallium locally

# To update
yarn global upgrade thallium # To update your global `tl`.
yarn upgrade thallium        # To update your local module.
```

Also, make sure you're familiar with ES2015, because most of the examples use it. [Here's a blog post on CSS Tricks that covers some of the highlights](https://css-tricks.com/lets-learn-es2015/), and if you want to dive deeper, [there's plenty of other resources for you to check out](https://github.com/ericdouglas/ES6-Learning).

Now that we've gotten Thallium installed, create a `test/index.js`, and let's create some simple tests, to make sure everything is set up correctly.

```js
"use strict";

// Load the necessary modules
const t = require("thallium");
const assert = require("thallium/assert");

// Define the tests
t.test("testing", () => {
    t.test("things work", () => {
        const myValue = "string";
        const yourValue = "string";

        assert.equal(myValue, yourValue);
    });
});

// `tl` runs the tests automatically
```

Now, in your terminal, in the project directory, run `tl`. You should get something similar to this:

```
$ tl

testing
    ✓ things work
```

Congratulations! You just ran your first Thallium test.

## More tests

Now, create an `index.js` file with the following:

```js
"use strict";
exports.value = "string";
```

And edit our test file to use that instead:

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");

// Load our module
const myModule = require("../index.js");

t.test("testing", () => {
    t.test("things work", () => {
        const yourValue = "string";

        assert.equal(myModule.value, yourValue);
    });
});
```

And just for good measure, run `tl` again. Keeping everything tested is good.

```
$ tl

testing
    ✓ things work
```

Failing tests are easy to spot in the mix. In this case, they won't be equal, and Thallium will let you know about this. Change your `test/index.js` file to say this:

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("../index.js");

t.test("testing", () => {
    t.test("things work", () => {
        // Change this value
        const yourValue = "nope";

        assert.equal(myModule.value, yourValue); // No longer equal!
    });
});
```

When you run `tl` this time, it immediately tells you it's failing.

```
$ tl

testing
    ✖ things work
```

Now, let's skip that known-failing test. So, we just tack `t.skip()` to the start of the body:

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("../index.js");

t.test("testing", () => {
    // This test won't even run.
    t.test("things work", () => {
        t.skip();
        const yourValue = "nope";

        assert.equal(myModule.value, yourValue); // Doesn't even run
    });
});
```

Because this is skipped, it won't fail, but will be marked as skipped:

```
$ tl

testing
    - things work
```

We could also skip tests with `t.only`, in which they won't even show up, much less run. If we dropped `t.only = [["testing", "other"]]` in the top scope of the test file, nothing would be run. Do be careful to not put this into version control, though.

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("../index.js");

// Here's your .only filter
t.only = [["testing", "other"]];

t.test("testing", function () {
    t.test("things work", function () {
        const yourValue = "string";

        assert.equal(myModule.value, yourValue);
    });
});
```

```
$ tl

<no tests printed>
```

Before we continue, let's fix that test again so it runs and passes.

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("../index.js");

t.test("testing", () => {
    t.test("things work", () => {
        const yourValue = "string";

        assert.equal(myModule.value, yourValue);
    });
});
```

And run `tl` to make sure it actually passes.

```
$ tl

testing
    ✓ things work
```

## Reporters

Well...it's nice and all to have this pretty spec reporter, but what if we want something else? Maybe a TAP reporter you can pipe into [tap-nyan](https://github.com/calvinmetcalf/tap-nyan)? First, create a new `.tl.js` in the project root with this:

```js
"use strict";

const t = require("thallium");

// Register the reporter - don't forget to call it as well
t.reporter = ["tap"];
```

And then, install tap-nyan and run `tl` again.

```
$ npm install --global tap-nyan

npm output...

$ tl | tap-nyan

interesting, colorful nyan cat output...
```

## File locations

If you would rather your test files be somewhere else (e.g. `file.spec.js` instead of `test/file.js`), you can specify what files you would rather use. So, rename your `test/index.js` to `index.spec.js`, change the `require("../index.js")` in it to `require("./index.js")`, and modify your `.tl.js` like this (and while we're at it, let's change back to the spec reporter):

```js
"use strict";

const t = require("thallium");

// If we use a config, we have to always specify the reporter we want to use.
t.reporter = ["spec"];

// Specify our files here. This could also be an array of files.
exports.files = "**/*.spec.js";
```

Now, let's run `tl` again, just to ensure everything's passing.

```
$ tl

testing
    ✓ things work
```

## Async tests and timeouts

In practice, especially if you're dealing with the file system, you're inevitably going to need to do something asynchronously, where you don't have the value immediately. In this case, you can just return a Promise that resolves when done, and rejected promises are counted just like thrown errors. So edit your `index.spec.js` to say this instead:

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("./index.js");

function asyncComputation() {
    return new Promise(resolve => {
        setTimeout(() => resolve(myModule.value), 10);
    });
}

t.test("testing", () => {
    t.test("things work", () => {
        return asyncComputation()
        .then(myValue => {
            const yourValue = "string";

            assert.equal(myValue, yourValue);
        });
    });
});
```

It's pretty easy, and works just as you would expect.

Also, with asynchronous tests, there is a default timeout of 2 seconds, in case the async test never actually resolves for some reason, like a network issue or a bug. If you have a test that takes longer than this, you'll probably want to set a new timeout and slow threshold:

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("./index.js");

function reallyLongAsyncComputation() {
    return new Promise(resolve => {
        // way longer timeout - simulate long operation
        setTimeout(() => resolve(myModule.value), 2500);
    });
}

t.test("testing", () => {
    t.test("things work", () => {
        t.timeout = 5000; // milliseconds - test timeout
        t.slow = 3000; // milliseconds - what's considered slow

        return reallyLongAsyncComputation()
        .then(myValue => {
            const yourValue = "string";

            assert.equal(myValue, yourValue);
        });
    });
});
```

Let's run `tl` again, just to ensure everything's still passing.

```
$ tl

testing
    ✓ things work
```

## Using extra flags

If you ever need extra flags, and don't want to pass them every time, just drop a `.tl.opts` file in your project root containing those flags. They may span multiple lines, and you can escape any character with a forward slash, including spaces with `\ ` or the forward slash itself with `\\`. Furthermore, comments are supported by starting with an unescaped `#`. Thallium will prepend all of the flags in that file to the command line internally before processing anything, so it can even include `--require` and similar.\*

If you include `--harmony` or other Node-specific or V8-specific flags, it'll even respawn Node for you with the correct flags. This means you can add `--harmony-async-functions` to your `.tl.opts` and then use magical async functions throughout your code, one of the latest additions to the language (that one was enabled by default in V8 a version too late to make it into Node 7).

\* *Well...that's a white lie. It works like it does that, but in reality, it still has to parse what was initially passed to find the correct `.tl.opts` file to load.*

## Using transpilers

So, say you prefer TypeScript, Babel, or even CoffeeScript? That's perfectly fine, and is supported out of the box. First, if you haven't already, install that language's compiler/register hook. Let's use TypeScript as an example, with its static types and ES6 module support (which Node doesn't have yet). First, let's create a fresh directory.

```
$ npm install --save-dev typescript ts-node

npm output...
```

Now, let's create a simple `index.ts` file.

```ts
export const value = "string";
```

Next, create an empty `.tl.ts` file. Alternatively, you could add a `.tl.opts` with `--require ts:ts-node` to a similar effect.

And finally, let's add a `test/index.ts` file.

```ts
import t from "thallium";
import * as assert from "thallium/assert";
import * as myModule from "../index";

t.test("testing", () => {
    t.test("things work", () => {
        const yourValue = "string";

        assert.equal(myModule.value, yourValue);
    });
});
```

Now, let's run it.

```
$ tl

testing
    ✓ things work
```

## Browser

Yes, this works in the browser, and you can use it with a reporter writing to the console (it doesn't *yet* have a built-in reporter that writes to the DOM, but that *is* planned). Here's a quick example of how to use it in the browser:

```html
<!DOCTYPE html>
<meta charset="utf-8">
<title>Thallium Tests</title>
<p>Please open the console.</p>

<!-- Load a Promise polyfill -->
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=Promise"></script>

<!-- Load Thallium -->
<script src="node_modules/thallium/thallium.js"></script>

<!-- Define and load our tests -->
<script>
// It's all in `thallium` as a single module.
var thallium = require("thallium");
var t = thallium.t;
var assert = thallium.assert;

t.reporter = ["spec"];

// Define the tests
t.test("testing", function () {
    t.test("things work", function () {
        var myValue = "string";
        var yourValue = "string";

        assert.equal(myValue, yourValue);
    });
});

// Then run it yourself.
t.run().catch(console.error.bind(console))
</script>
```

*No ES6 features were used here because browser support is only just now catching up across the board.*

## Node, without the runner

If you prefer to avoid the test runner and just want to throw everything into a single file, you can also do that, and it works similarly to how it works in the browser. So, if you want to do things this way, first, create a `test.js` file, and write some tests.

```js
"use strict";

const t = require("thallium");
const assert = require("thallium/assert");
const myModule = require("../index.js"); // From earlier

t.reporter = ["spec"];

// Define the tests
t.test("testing", () => {
    t.test("things work", () => {
        const yourValue = "string";

        assert.equal(myModule.value, yourValue);
    });
});

// Then run it yourself.
t.run()
```

Then, you can run `node test.js`, and it should look something like this.

```
$ node test.js

testing
    ✓ things work
```
