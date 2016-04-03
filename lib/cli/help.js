"use strict"

var readFileSync = require("fs").readFileSync
var resolve = require("path").resolve

exports.help = function (value) {
    var file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(readFileSync(resolve(__dirname, file), "utf-8"))
}
