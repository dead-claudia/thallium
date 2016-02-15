"use strict"
var fs = require("fs")
var path = require("path")

module.exports = function (detailed) {
    var file = detailed ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(fs.readFileSync(path.resolve(__dirname, file), "utf-8"))
}
