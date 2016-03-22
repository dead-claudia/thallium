"use strict"

if (require.main !== module) {
    throw new Error("This is not a module!")
}

var cwd = process.cwd()
var argv = process.argv.slice(2)

process.title = "techtonic " +
    argv
    .map(function (x) { return "'" + JSON.stringify(x).slice(1, -1) + "'" })
    .join(" ")

require("../lib/cli/cli.js")(cwd, argv).then(function () {
    process.exit()
}, function (err) {
    console.error(err)
    process.exit(1)
})
