#!/usr/bin/env node
"use strict"

/* eslint-disable no-process-exit */

if (require.main !== module) {
    throw new Error("This is not a module!")
}

require("../lib/cli-run.js").run({
    cwd: process.cwd(),
    argv: process.argv.slice(2),
    util: require("../lib/cli-fs-util.js"), // eslint-disable-line global-require
})
.catch(function (e) {
    console.error(e.stack)
    return 1
})
.then(process.exit)
