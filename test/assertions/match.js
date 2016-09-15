"use strict"

/* global Map, Set, Buffer */

describe("assertions (match)", function () { // eslint-disable-line max-statements, max-len
    function check(name, a, b, opts) {
        function m(key) {
            return opts[key] ? key : "not" + key[0].toUpperCase() + key.slice(1)
        }

        it(name, function () {
            t[m("matchStrict")](a, b)
            t[m("matchLoose")](a, b)
            t[m("match")](a, b)
        })
    }

    it("exists", function () {
        t.function(t.matchStrict)
        t.function(t.notDeepEqual)
        t.function(t.matchLoose)
        t.function(t.notDeepEqualLoose)
        t.function(t.match)
        t.function(t.notMatch)
        t.function(t.matchLoose)
        t.function(t.notMatchLoose)
    })

    it("correct aliases", function () {
        t.equal(t.matchLoose, t.matchLoose)
        t.equal(t.notMatchLoose, t.notDeepEqualLoose)
    })

    check("equal",
        {a: [2, 3], b: [4]},
        {a: [2, 3], b: [4]},
        {matchStrict: true, matchLoose: true, match: true})

    check("not equal",
        {x: 5, y: [6]},
        {x: 5, y: 6},
        {matchStrict: false, matchLoose: false, match: false})

    check("nested nulls",
        [null, null, null],
        [null, null, null],
        {matchStrict: true, matchLoose: true, match: true})

    check("strict equal",
        [{a: 3}, {b: 4}],
        [{a: "3"}, {b: "4"}],
        {matchStrict: false, matchLoose: true, match: false})

    check("same numbers", 3, 3, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("different numbers", 1, 3, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("same strings", "beep", "beep", {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("different strings", "beep", "beep", {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("string + number", "3", 3, {
        matchStrict: false,
        matchLoose: true,
        match: false,
    })

    check("number + string", 3, "3", {
        matchStrict: false,
        matchLoose: true,
        match: false,
    })

    check("different string + number", "3", 5, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("different number + string", 3, "5", {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("string + [number]", "3", [3], {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("number + [string]", 3, ["3"], {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    function toArgs() { return arguments }

    check("same arguments",
        toArgs(1, 2, 3),
        toArgs(1, 2, 3),
        {matchStrict: true, matchLoose: true, match: true})

    check("different arguments",
        toArgs(1, 2, 3),
        toArgs(3, 2, 1),
        {matchStrict: false, matchLoose: false, match: false})

    check("similar arguments + array",
        toArgs(1, 2, 3),
        [1, 2, 3],
        {matchStrict: false, matchLoose: false, match: false})

    check("similar array + arguments",
        [1, 2, 3],
        toArgs(1, 2, 3),
        {matchStrict: false, matchLoose: false, match: false})

    check("same date",
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        {matchStrict: true, matchLoose: true, match: true})

    check("different date",
        new Date("Thu, 01 Jan 1970 00:00:00 GMT"),
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
        {matchStrict: false, matchLoose: false, match: false})

    if (typeof Buffer === "function") {
        check("same buffers", new Buffer("xyz"), new Buffer("xyz"), {
            matchStrict: true,
            matchLoose: true,
            match: true,
        })

        check("different buffers", new Buffer("abc"), new Buffer("xyz"), {
            matchStrict: false,
            matchLoose: false,
            match: false,
        })
    }

    check("boolean + array", true, [], {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("both null", null, null, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("both undefined", undefined, undefined, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("null + undefined", null, undefined, {
        matchStrict: false,
        matchLoose: true,
        match: false,
    })

    check("undefined + null", undefined, null, {
        matchStrict: false,
        matchLoose: true,
        match: false,
    })

    function A() { this.prop = 1 }
    function B() { this.prop = 1 }

    check("same prototypes", new A(), new A(), {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("different prototypes", new A(), new B(), {
        matchStrict: false,
        matchLoose: true,
        match: true,
    })

    check("object + string", "foo", {bar: 1}, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("string + object", {foo: 1}, "bar", {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("same strings", "foo", "foo", {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("different strings", "foo", "bar", {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("differing keys", {a: 1, b: 2}, {b: 1, c: 2}, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    if (typeof Symbol === "function") { // eslint-disable-line no-undef
        var symbol = Symbol("foo") // eslint-disable-line no-undef

        check("same symbols", symbol, symbol, {
            matchStrict: true,
            matchLoose: true,
            match: true,
        })

        check("similar symbols", Symbol("foo"), Symbol("foo"), { // eslint-disable-line no-undef, max-len
            matchStrict: false,
            matchLoose: true,
            match: true,
        })

        check("different symbols", Symbol("foo"), Symbol("bar"), { // eslint-disable-line no-undef, max-len
            matchStrict: false,
            matchLoose: false,
            match: false,
        })
    }

    function bar() {}

    if (typeof Map === "function" && typeof Set === "function") {
        check("empty maps", new Map(), new Map(), {
            matchStrict: true,
            matchLoose: true,
            match: true,
        })

        check("maps with same primitive keys",
            new Map([["foo", "bar"]]),
            new Map([["foo", "bar"]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with different primitive keys",
            new Map([["foo", "bar"]]),
            new Map([["bar", "bar"]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with different primitive values",
            new Map([["foo", "bar"]]),
            new Map([["foo", "foo"]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with different primitive both",
            new Map([["foo", "bar"]]),
            new Map([["bar", "foo"]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with loosely same primitive key",
            new Map([[1, "foo"]]),
            new Map([["1", "foo"]]),
            {matchStrict: false, matchLoose: true, match: false})

        check("maps with loosely same primitive value",
            new Map([["foo", 1]]),
            new Map([["foo", "1"]]),
            {matchStrict: false, matchLoose: true, match: false})

        check("maps with loosely same primitive both",
            new Map([["1", 1]]),
            new Map([[1, "1"]]),
            {matchStrict: false, matchLoose: true, match: false})

        check("maps with many same primitive keys",
            new Map([["foo", "bar"], ["bar", 1], [1, 2], [true, 3]]),
            new Map([["foo", "bar"], ["bar", 1], [1, 2], [true, 3]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with many different primitive keys",
            new Map([["foo", "bar"], ["bar", 1], [1, 2], [true, 3]]),
            new Map([["foo", "bar"], ["bar", 2], ["15", 2], [false, 4]]),
            {matchStrict: false, matchLoose: false, match: false})

        var mapObj = {foo: "bar"}

        check("maps with identical keys",
            new Map([[mapObj, "bar"]]),
            new Map([[mapObj, "bar"]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with structurally similar keys",
            new Map([[{foo: "bar"}, "bar"]]),
            new Map([[{foo: "bar"}, "bar"]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with structurally different keys",
            new Map([[{foo: "bar"}, "bar"]]),
            new Map([[{bar: "foo"}, "bar"]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with structurally similar values",
            new Map([["bar", {foo: "bar"}]]),
            new Map([["bar", {foo: "bar"}]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with structurally different values",
            new Map([["bar", {foo: "bar"}]]),
            new Map([["bar", {bar: "foo"}]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with structurally similar both",
            new Map([[{foo: "bar"}, {foo: "bar"}]]),
            new Map([[{foo: "bar"}, {foo: "bar"}]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("maps with structurally different both",
            new Map([[{foo: "bar"}, {foo: "bar"}]]),
            new Map([[{bar: "foo"}, {bar: "foo"}]]),
            {matchStrict: false, matchLoose: false, match: false})

        check("maps with inner functions",
            new Map([[{foo: "bar", bar: bar}, {foo: "bar", bar: bar}]]),
            new Map([[{foo: "bar", bar: bar}, {foo: "bar", bar: bar}]]),
            {matchStrict: true, matchLoose: true, match: true})

        check("empty sets", new Set(), new Set(), {
            matchStrict: true,
            matchLoose: true,
            match: true,
        })

        check("sets with same primitive values",
            new Set(["foo", "bar"]),
            new Set(["foo", "bar"]),
            {matchStrict: true, matchLoose: true, match: true})

        check("sets with different primitive values",
            new Set(["foo", "bar"]),
            new Set(["bar", "bar"]),
            {matchStrict: false, matchLoose: false, match: false})

        check("sets with loosely same primitive value",
            new Set([1, "foo"]),
            new Set(["1", "foo"]),
            {matchStrict: false, matchLoose: true, match: false})

        check("sets with many same primitive values",
            new Set(["foo", "bar", "bar", 1, 1, 2, true, 3]),
            new Set(["foo", "bar", "bar", 1, 1, 2, true, 3]),
            {matchStrict: true, matchLoose: true, match: true})

        check("sets with many different primitive values",
            new Set(["foo", "bar", "bar", 1, 1, 2, true, 3]),
            new Set(["foo", "bar", "bar", 2, "15", 2, false, 4]),
            {matchStrict: false, matchLoose: false, match: false})

        var setObj = {foo: "bar"}

        check("sets with identical values",
            new Set([setObj, "bar"]),
            new Set([setObj, "bar"]),
            {matchStrict: true, matchLoose: true, match: true})

        check("sets with structurally similar values",
            new Set([{foo: "bar"}, "bar"]),
            new Set([{foo: "bar"}, "bar"]),
            {matchStrict: true, matchLoose: true, match: true})

        check("sets with structurally different values",
            new Set([{foo: "bar"}, "bar"]),
            new Set([{bar: "foo"}, "bar"]),
            {matchStrict: false, matchLoose: false, match: false})
    }

    // Derived from a failing LoaderData test
    (function () { // eslint-disable-line max-statements
        function load() {}

        function register(ext, value, load, use) {
            return {
                ext: ext,
                value: value,
                require: load,
                use: use,
                loaded: false,
                original: false,
            }
        }

        function simple(module, load) {
            return {module: module, load: load, loaded: false}
        }

        function Register(ext, value, load, use) {
            this.ext = ext
            this.value = value
            this.require = load
            this.loaded = false
            this.use = use
            this.original = false
        }

        function Simple(module, load) {
            this.module = module
            this.require = load
            this.loaded = false
        }

        function Ext(ext) {
            this.ext = ext
        }

        function Id(id) {
            this.id = id
        }

        /* eslint-disable max-len */

        if (typeof Map === "function") {
            check("really complex maps with objects",
                new Map([
                    [".my-shell", register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", register(".js", "./babel-register-wrapper", load, true)],
                    [0, simple("./util/env.my-shell", load)],
                    [".ls", register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Map([
                    [".my-shell", register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", register(".js", "./babel-register-wrapper", load, true)],
                    [".ls", register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [0, simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("really complex maps with classes",
                new Map([
                    [".my-shell", new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", new Register(".js", "./babel-register-wrapper", load, true)],
                    [0, new Simple("./util/env.my-shell", load)],
                    [".ls", new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Map([
                    [".my-shell", new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", new Register(".js", "./babel-register-wrapper", load, true)],
                    [".ls", new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [0, new Simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            var map1 = new Map()
            var map2 = new Map()

            map1.set("foo", map1)
            map2.set("foo", map2)

            check("maps with circular references", map1, map2, {
                matchStrict: true,
                matchLoose: true,
                match: true,
            })
        }

        if (typeof Set === "function") {
            check("complex sets with differently ordered primitive + object",
                new Set([
                    [".my-shell", register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", register(".js", "./babel-register-wrapper", load, true)],
                    [0, simple("./util/env.my-shell", load)],
                    [".ls", register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [".my-shell", register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", register(".js", "./babel-register-wrapper", load, true)],
                    [".ls", register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [0, simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("complex sets with differently ordered primitive + class",
                new Set([
                    [".my-shell", new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", new Register(".js", "./babel-register-wrapper", load, true)],
                    [0, new Simple("./util/env.my-shell", load)],
                    [".ls", new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [".my-shell", new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [".js", new Register(".js", "./babel-register-wrapper", load, true)],
                    [".ls", new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [".coffee", new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [0, new Simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("complex sets with differently ordered object + object",
                new Set([
                    [{ext: ".my-shell"}, register(".my-shell", "@company/my-shell/register", load, true)],
                    [{ext: ".js"}, register(".js", "./babel-register-wrapper", load, true)],
                    [{id: 0}, simple("./util/env.my-shell", load)],
                    [{ext: ".ls"}, register(".ls", ["livescript", "LiveScript"], load, false)],
                    [{ext: ".coffee"}, register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [{ext: ".my-shell"}, register(".my-shell", "@company/my-shell/register", load, true)],
                    [{ext: ".js"}, register(".js", "./babel-register-wrapper", load, true)],
                    [{ext: ".ls"}, register(".ls", ["livescript", "LiveScript"], load, false)],
                    [{ext: ".coffee"}, register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [{id: 0}, simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("complex sets with differently ordered object + class",
                new Set([
                    [{ext: ".my-shell"}, new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [{ext: ".js"}, new Register(".js", "./babel-register-wrapper", load, true)],
                    [{id: 0}, new Simple("./util/env.my-shell", load)],
                    [{ext: ".ls"}, new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [{ext: ".coffee"}, new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [{ext: ".my-shell"}, new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [{ext: ".js"}, new Register(".js", "./babel-register-wrapper", load, true)],
                    [{ext: ".ls"}, new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [{ext: ".coffee"}, new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [{id: 0}, new Simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("complex sets with differently ordered class + object",
                new Set([
                    [new Ext(".my-shell"), register(".my-shell", "@company/my-shell/register", load, true)],
                    [new Ext(".js"), register(".js", "./babel-register-wrapper", load, true)],
                    [new Id(0), simple("./util/env.my-shell", load)],
                    [new Ext(".ls"), register(".ls", ["livescript", "LiveScript"], load, false)],
                    [new Ext(".coffee"), register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [new Ext(".my-shell"), register(".my-shell", "@company/my-shell/register", load, true)],
                    [new Ext(".js"), register(".js", "./babel-register-wrapper", load, true)],
                    [new Ext(".ls"), register(".ls", ["livescript", "LiveScript"], load, false)],
                    [new Ext(".coffee"), register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [new Id(0), simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            check("complex sets with differently ordered class + class",
                new Set([
                    [new Ext(".my-shell"), new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [new Ext(".js"), new Register(".js", "./babel-register-wrapper", load, true)],
                    [new Id(0), new Simple("./util/env.my-shell", load)],
                    [new Ext(".ls"), new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [new Ext(".coffee"), new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                ]),
                new Set([
                    [new Ext(".my-shell"), new Register(".my-shell", "@company/my-shell/register", load, true)],
                    [new Ext(".js"), new Register(".js", "./babel-register-wrapper", load, true)],
                    [new Ext(".ls"), new Register(".ls", ["livescript", "LiveScript"], load, false)],
                    [new Ext(".coffee"), new Register(".coffee", ["coffee-script/register", "coffee-script"], load, false)],
                    [new Id(0), new Simple("./util/env.my-shell", load)],
                ]),
                {matchStrict: true, matchLoose: true, match: true})

            var set1 = new Set()
            var set2 = new Set()

            set1.add(set1)
            set2.add(set2)

            check("sets with circular references", set1, set2, {
                matchStrict: true,
                matchLoose: true,
                match: true,
            })
        }

        /* eslint-enable max-len */
    })()

    function f() {}

    check("same functions", f, f, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("different functions", function () {}, function () {}, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    var circular1 = {foo: 1}
    var circular2 = {foo: 1}
    var circular3 = {foo: 1}

    circular1.a = circular1
    circular2.a = circular2
    circular3.b = circular3

    check("circular reference match", circular1, circular2, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("circular references don't match", circular1, circular3, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("one circular", circular1, {foo: 1, a: {}}, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("regexps match", /foo/gim, /foo/mig, {
        matchStrict: true,
        matchLoose: true,
        match: true,
    })

    check("regexp source doesn't match", /foo/gim, /bar/mig, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })

    check("regexp flags don't match", /foo/gi, /foo/gim, {
        matchStrict: false,
        matchLoose: false,
        match: false,
    })
})
