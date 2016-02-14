"use strict"

var path = require("path")

exports.fixture = function (file) {
    return path.resolve(__dirname, "../test-fixtures", file)
}
