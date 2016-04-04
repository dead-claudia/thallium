"use strict"

/* global Symbol */

var t = require("../../index.js")

describe("assertions (deep equal)", function () { // eslint-disable-line max-statements, max-len
    function check(name, a, b, opts) {
        function m(key) {
            return opts[key] ? key : "not" + key[0].toUpperCase() + key.slice(1)
        }

        it(name, function () {
            t[m("deepEqual")](a, b)
            t[m("looseDeepEqual")](a, b)
            t[m("match")](a, b)
        })
    }

    it("exists", function () {
        t.function(t.deepEqual)
        t.function(t.notDeepEqual)
        t.function(t.looseDeepEqual)
        t.function(t.notLooseDeepEqual)
        t.function(t.match)
        t.function(t.notMatch)
        t.function(t.matchLoose)
        t.function(t.notMatchLoose)
    })

    it("correct aliases", function () {
        t.equal(t.matchLoose, t.looseDeepEqual)
        t.equal(t.notMatchLoose, t.notLooseDeepEqual)
    })

    check("equal",
        {a: [2, 3], b: [4]},
        {a: [2, 3], b: [4]},
        {deepEqual: true, looseDeepEqual: true, match: true})

    check("not equal",
        {x: 5, y: [6]},
        {x: 5, y: 6},
        {deepEqual: false, looseDeepEqual: false, match: false})

    check("nested nulls",
        [null, null, null],
        [null, null, null],
        {deepEqual: true, looseDeepEqual: true, match: true})

    check("strict equal",
        [{a: 3}, {b: 4}],
        [{a: "3"}, {b: "4"}],
        {deepEqual: false, looseDeepEqual: true, match: false})

    check("same numbers", 3, 3, {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("different numbers", 1, 3, {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("same strings", "beep", "beep", {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("different strings", "beep", "beep", {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("string + number", "3", 3, {
        deepEqual: false,
        looseDeepEqual: true,
        match: false,
    })

    check("number + string", 3, "3", {
        deepEqual: false,
        looseDeepEqual: true,
        match: false,
    })

    check("different string + number", "3", 5, {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("different number + string", 3, "5", {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("string + [number]", "3", [3], {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("number + [string]", 3, ["3"], {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    function toArgs() { return arguments }

    check("same arguments",
        toArgs(1, 2, 3),
        toArgs(1, 2, 3),
        {deepEqual: true, looseDeepEqual: true, match: true})

    check("different arguments",
        toArgs(1, 2, 3),
        toArgs(3, 2, 1),
        {deepEqual: false, looseDeepEqual: false, match: false})

    check("similar arguments + array",
        toArgs(1, 2, 3),
        [1, 2, 3],
        {deepEqual: false, looseDeepEqual: false, match: false})

    check("similar array + arguments",
        [1, 2, 3],
        toArgs(1, 2, 3),
        {deepEqual: false, looseDeepEqual: false, match: false})

    check("same date",
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        {deepEqual: true, looseDeepEqual: true, match: true})

    check("different date",
        new Date("Thu, 01 Jan 1970 00:00:00 GMT"),
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        {deepEqual: false, looseDeepEqual: false, match: false})

    if (typeof Buffer === "function") {
        check("same buffers", new Buffer("xyz"), new Buffer("xyz"), {
            deepEqual: true,
            looseDeepEqual: true,
            match: true,
        })

        check("different buffers", new Buffer("abc"), new Buffer("xyz"), {
            deepEqual: false,
            looseDeepEqual: false,
            match: false,
        })
    }

    check("boolean + array", true, [], {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("both null", null, null, {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("both undefined", undefined, undefined, {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("null + undefined", null, undefined, {
        deepEqual: false,
        looseDeepEqual: true,
        match: false,
    })

    check("undefined + null", undefined, null, {
        deepEqual: false,
        looseDeepEqual: true,
        match: false,
    })

    function A() { this.prop = 1 }
    function B() { this.prop = 1 }

    check("same prototypes", new A(), new A(), {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("different prototypes", new A(), new B(), {
        deepEqual: false,
        looseDeepEqual: true,
        match: true,
    })

    check("object + string", "foo", {bar: 1}, {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("string + object", {foo: 1}, "bar", {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("same strings", "foo", "foo", {
        deepEqual: true,
        looseDeepEqual: true,
        match: true,
    })

    check("different strings", "foo", "bar", {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    check("differing keys", {a: 1, b: 2}, {b: 1, c: 2}, {
        deepEqual: false,
        looseDeepEqual: false,
        match: false,
    })

    if (typeof Symbol === "function" && typeof Symbol() === "symbol") {
        var foo = Symbol("foo")

        check("same symbols", foo, foo, {
            deepEqual: true,
            looseDeepEqual: true,
            match: true,
        })

        check("similar symbols", Symbol("foo"), Symbol("foo"), {
            deepEqual: false,
            looseDeepEqual: true,
            match: true,
        })

        check("different symbols", Symbol("foo"), Symbol("bar"), {
            deepEqual: false,
            looseDeepEqual: false,
            match: false,
        })
    }
})
