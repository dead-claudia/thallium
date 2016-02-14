"use strict"

if (require.main !== module) {
    throw new Error("This is not a module!")
}

process.title = "techtonic"

var cwd = process.cwd()
var argv = process.argv.slice(2)

require("../lib/cli/cli.js")(cwd, argv, function (err) {
    if (err != null) {
        console.error(err)
        process.exit(1)
    } else {
        process.exit()
    }
})
