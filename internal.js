"use strict"

var Thallium = require("./lib/api/thallium")
var Reports = require("./lib/core/reports")
var Types = Reports.Types

exports.root = function () {
    return new Thallium()
}

function d(duration) {
    if (duration == null) return 10
    if (typeof duration === "number") return duration|0
    throw new TypeError("Expected `duration` to be a number if it exists")
}

function s(slow) {
    if (slow == null) return 75
    if (typeof slow === "number") return slow|0
    throw new TypeError("Expected `slow` to be a number if it exists")
}

function p(path) {
    if (Array.isArray(path)) return path
    throw new TypeError("Expected `path` to be an array of locations")
}

/**
 * Create a new report, mainly for testing reporters.
 */
exports.reports = {
    start: function () {
        return Reports.start()
    },

    enter: function (path, duration, slow) {
        return Reports.enter(p(path), d(duration), s(slow))
    },

    leave: function (path) {
        return Reports.leave(p(path))
    },

    pass: function (path, duration, slow) {
        return Reports.pass(p(path), d(duration), s(slow))
    },

    fail: function (path, value, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
        return Reports.fail(
            p(path), value, d(duration), s(slow),
            !!isFailable)
    },

    skip: function (path) {
        return Reports.skip(p(path))
    },

    end: function () {
        return Reports.end()
    },

    error: function (value) {
        return Reports.error(value)
    },

    /**
     * Create a new hook error, mainly for testing reporters.
     */
    hook: {
        beforeAll: function (path, rootPath, func, value) {
            return Reports.hook(Types.BeforeAll, p(path), p(rootPath),
                func, value)
        },

        beforeEach: function (path, rootPath, func, value) {
            return Reports.hook(Types.BeforeEach, p(path), p(rootPath),
                func, value)
        },

        afterEach: function (path, rootPath, func, value) {
            return Reports.hook(Types.AfterEach, p(path), p(rootPath),
                func, value)
        },

        afterAll: function (path, rootPath, func, value) {
            return Reports.hook(Types.AfterAll, p(path), p(rootPath),
                func, value)
        },
    },
}

/**
 * Creates a new location, mainly for testing reporters.
 */
exports.location = function (name, index) {
    if (typeof name !== "string") {
        throw new TypeError("Expected `name` to be a string")
    }

    if (typeof index !== "number") {
        throw new TypeError("Expected `index` to be a number")
    }

    return {name: name, index: index|0}
}
