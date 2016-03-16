"use strict"

var methods = require("../util/methods.js")

module.exports = ArgumentError
function ArgumentError(message) {
    this.message = message

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ArgumentError)
    } else {
        var e = new Error(message)

        e.name = this.name
        this.stack = e.stack
    }
}

methods(ArgumentError, Error, {
    name: "ArgumentError",
})
