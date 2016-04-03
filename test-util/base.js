"use strict"

var path = require("path")

// This is merely to survive mocking this module
var resolve = require("resolve")

exports.a = function () {
    var args = []

    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return args
}

exports.sync = resolve.sync
exports.resolveAsync = resolve

exports.fixture = function (name) {
    return path.resolve(__dirname, "../test-fixtures", name)
}

exports.paths = {
    "techtonic": path.resolve(__dirname, "../lib/index"),
    "techtonic/core": path.resolve(__dirname, "../lib/core"),
    "techtonic/assertions": path.resolve(__dirname, "../lib/assertions"),
}

exports.push = function (ret) {
    return function (arg, done) {
        ret.push(arg)
        done()
    }
}

exports.n = function (type, path, value) {
    return {type: type, path: path, value: value}
}

exports.p = function (name, index) {
    return {name: name, index: index}
}
