"use strict"

var error = require("../util/error.js")

exports.ArgumentError = error.createError({
    constructor: function ArgumentError(message) {
        this.message = message
        error.recordStack(this)
    },
    name: "ArgumentError",
})
