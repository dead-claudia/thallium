"use strict"

const readFileSync = require("fs").readFileSync
const resolve = require("path").resolve

module.exports = value => {
    const file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(readFileSync(resolve(__dirname, file), "utf-8"))
}
