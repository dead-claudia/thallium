"use strict"

/* eslint-env node */

// Much easier to use a concise DSL than for serialization to compare in
// assertions. Short description:
//
// Global scope:
//
//  Type     Value
//   |         |
//  \|/       \|/
// start = undefined
//
// Inside a test:
//
//    Test index     Subtest index             Value
//  Type  |  Test name     |   Subtest name      |
//   |    |      |         |        |            |
//  \|/  \|/    \|/       \|/      \|/          \|/
// extra [0: test name] > [1: subtest name] = "value"

function fix(value) {
    if (typeof value === "string") return JSON.stringify(value)
    if (typeof value === "number") return value
    if (typeof value === "boolean") return value
    if (typeof value === "function") return JSON.stringify(value.toString())
    if (typeof value === "symbol") return JSON.stringify(value.toString())
    if (value == null) return value
    if (value instanceof Error) return JSON.stringify(value.toString())
    return value
}

function getTypeString(ev) {
    if (ev.start()) return "start"
    if (ev.enter()) return "enter"
    if (ev.leave()) return "leave"
    if (ev.pass()) return "pass"
    if (ev.fail()) return "fail"
    if (ev.skip()) return "skip"
    if (ev.end()) return "end"
    if (ev.error()) return "error"
    if (ev.extra()) return "extra"
    throw new Error("unreachable")
}

module.exports = function (ev, done) {
    var path = ev.path
    .map(function (x) { return "[" + x.index + ": " + x.name + "]" })
    .join(" > ")

    console.log(getTypeString(ev) + " " +
        (path ? path + " = " : "= ") +
        fix(ev.value))

    return done()
}
