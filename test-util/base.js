"use strict"

var path = require("path")

exports.fixture = function (directory) {
    return path.resolve(__dirname, "../test-fixtures", directory)
}

// This is merely to survive mocking this module
var resolve = require("resolve")

exports.resolve = resolve.sync
exports.resolveAsync = resolve

exports.paths = {
    "techtonic": path.resolve(__dirname, "../index.js"),
    "techtonic/core": path.resolve(__dirname, "../core.js"),
    "techtonic/assertions": path.resolve(__dirname, "../assertions.js"),
}

exports.wrap = function (done, func) {
    return function (err) {
        if (err != null) return done(err)
        try {
            func()
        } catch (e) {
            return done(e)
        }
        return done()
    }
}

exports.push = function (ret) {
    return function (arg, done) {
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, name, index, parent, value) { // eslint-disable-line max-params, max-len
    return {
        type: type,
        name: name,
        index: index,
        parent: parent,
        value: value,
    }
}

exports.p = function (name, index, parent) {
    return {name: name, index: index, parent: parent}
}
