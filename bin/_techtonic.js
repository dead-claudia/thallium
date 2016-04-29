"use strict"

if (require.main !== module) {
    throw new Error("This is not a module!")
}

// One of the few legitimate use cases for Bluebird's Promise#done().
require("../lib/cli/run.js").run({
    cwd: process.cwd(),
    argv: process.argv.slice(2),
    util: require("../lib/cli/util.js"), // eslint-disable-line global-require
})
.then(process.exit)
.catch(e => {
    console.error(e.stack)
    process.exit(1)
})
