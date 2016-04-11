"use strict"

const t = require("../../index.js")
const fail = require("../../test-util/assertions.js").fail

describe("assertions (includes)", () => {
    it("correct aliases", () => {
        t.equal(t.includesMatchLoose, t.includesLooseDeep)
        t.equal(t.notIncludesMatchLooseAll, t.notIncludesLooseDeepAll)
        t.equal(t.includesMatchLooseAny, t.includesLooseDeepAny)
        t.equal(t.notIncludesMatchLoose, t.notIncludesLooseDeep)
    })

    describe("t.includes()", () => {
        it("checks numbers", () => {
            t.includes([1, 2, 3, 4, 5], 1)
            t.includes([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includes", ["1", 2, 3, 4, 5], 1)
            fail("includes", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includes([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includes([obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("includes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.includes([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includes", [1, 2, 3, 4, 5], 10)
            fail("includes", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includes", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includes", [obj1, obj2, obj3], [{}])
            fail("includes", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesAll()", () => {
        it("checks numbers", () => {
            fail("notIncludesAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludesAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesAll", [obj1, obj2, obj3], [obj1, obj2, obj3])
            t.notIncludesAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.notIncludesAll([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesAll([1, 2, 3, 4, 5], 10)
            t.notIncludesAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("t.includesAny()", () => {
        it("checks numbers", () => {
            t.includesAny([1, 2, 3, 4, 5], 1)
            t.includesAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includesAny", ["1", 2, 3, 4, 5], 1)
            fail("includesAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.includesAny([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesAny", [1, 2, 3, 4, 5], 10)
            fail("includesAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesAny", [obj1, obj2, obj3], [{}])
            fail("includesAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludes()", () => {
        it("checks numbers", () => {
            fail("notIncludes", [1, 2, 3, 4, 5], 1)
            fail("notIncludes", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludes(["1", 2, 3, 4, 5], 1)
            t.notIncludes(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludes", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.notIncludes([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludes([1, 2, 3, 4, 5], 10)
            t.notIncludes([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludes([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludes([obj1, obj2, obj3], [{}])
            t.notIncludes([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesLoose()", () => {
        it("checks numbers", () => {
            t.includesLoose([1, 2, 3, 4, 5], 1)
            t.includesLoose([1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            t.includesLoose(["1", 2, 3, 4, 5], 1)
            t.includesLoose(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesLoose([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLoose([obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("includesLoose", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.includesLoose([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesLoose", [1, 2, 3, 4, 5], 10)
            fail("includesLoose", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesLoose", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesLooseAll()", () => {
        it("checks numbers", () => {
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], 1)
            fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesLooseAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLooseAll", [obj1, obj2, obj3], [obj1, obj2, obj3])
            t.notIncludesLooseAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.notIncludesLooseAll([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesLooseAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesLooseAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLooseAll([obj1, obj2, obj3], [{}])
            t.notIncludesLooseAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("t.includesAny()", () => {
        it("checks numbers", () => {
            t.includesLooseAny([1, 2, 3, 4, 5], 1)
            t.includesLooseAny([1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            t.includesLooseAny(["1", 2, 3, 4, 5], 1)
            t.includesLooseAny(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.includesLooseAny([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesLooseAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesLooseAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesLoose()", () => {
        it("checks numbers", () => {
            fail("notIncludesLoose", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLoose", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            fail("notIncludesLoose", ["1", 2, 3, 4, 5], 1)
            fail("notIncludesLoose", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLoose", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", () => {
            t.notIncludesLoose([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesLoose([1, 2, 3, 4, 5], 10)
            t.notIncludesLoose([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesLoose([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesDeep()", () => {
        it("checks numbers", () => {
            t.includesDeep([1, 2, 3, 4, 5], 1)
            t.includesDeep([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includesDeep", ["1", 2, 3, 4, 5], 1)
            fail("includesDeep", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesDeep([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesDeep([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesDeep([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesDeep([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", () => {
            t.includesDeep([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesDeep", [1, 2, 3, 4, 5], 10)
            fail("includesDeep", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesDeepAll()", () => {
        it("checks numbers", () => {
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.notIncludesDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("notIncludesDeepAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesDeepAll([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesDeepAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.includesDeepAny()", () => {
        it("checks numbers", () => {
            t.includesDeepAny([1, 2, 3, 4, 5], 1)
            t.includesDeepAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includesDeepAny", ["1", 2, 3, 4, 5], 1)
            fail("includesDeepAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.includesDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.includesDeepAny([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesDeepAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesDeep()", () => {
        it("checks numbers", () => {
            fail("notIncludesDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeep", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludesDeep(["1", 2, 3, 4, 5], 1)
            t.notIncludesDeep(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            fail("notIncludesDeep", [{foo: 1}, 3, "foo"], ["foo", 1])
            fail("notIncludesDeep", [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("notIncludesDeep", [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesDeep([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesDeep([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesLooseDeep()", () => {
        it("checks numbers", () => {
            t.includesLooseDeep([1, 2, 3, 4, 5], 1)
            t.includesLooseDeep([1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            t.includesLooseDeep(["1", 2, 3, 4, 5], 1)
            t.includesLooseDeep(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesLooseDeep([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseDeep([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesLooseDeep([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesLooseDeep([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesLooseDeep([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesLooseDeep([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", () => {
            t.includesLooseDeep([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesLooseDeep", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeep", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesLooseDeepAll()", () => {
        it("checks numbers", () => {
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            fail("notIncludesLooseDeepAll", ["1", 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeepAll", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.notIncludesLooseDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])

            t.notIncludesLooseDeepAll(
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeepAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesLooseDeepAll([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesLooseDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesLooseDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.includesLooseDeepAny()", () => {
        it("checks numbers", () => {
            t.includesLooseDeepAny([1, 2, 3, 4, 5], 1)
            t.includesLooseDeepAny([1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            t.includesLooseDeepAny(["1", 2, 3, 4, 5], 1)
            t.includesLooseDeepAny(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.includesLooseDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.includesLooseDeepAny([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesLooseDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesLooseDeep()", () => {
        it("checks numbers", () => {
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", () => {
            fail("notIncludesLooseDeep", ["1", 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeep", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            fail("notIncludesLooseDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesLooseDeep([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesLooseDeep([{foo: 1}, {bar: 2}, {}], [[]])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}, {}],
                [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesMatch()", () => {
        it("checks numbers", () => {
            t.includesMatch([1, 2, 3, 4, 5], 1)
            t.includesMatch([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includesMatch", ["1", 2, 3, 4, 5], 1)
            fail("includesMatch", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesMatch([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesMatch([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesMatch([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesMatch([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", () => {
            t.includesMatch([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesMatch", [1, 2, 3, 4, 5], 10)
            fail("includesMatch", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesMatch", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesMatch", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesMatchAll()", () => {
        it("checks numbers", () => {
            fail("notIncludesMatchAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesMatchAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludesMatchAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesMatchAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.notIncludesMatchAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesMatchAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesMatchAll([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesMatchAll([1, 2, 3, 4, 5], 10)
            t.notIncludesMatchAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.includesMatchAny()", () => {
        it("checks numbers", () => {
            t.includesMatchAny([1, 2, 3, 4, 5], 1)
            t.includesMatchAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            fail("includesMatchAny", ["1", 2, 3, 4, 5], 1)
            fail("includesMatchAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            t.includesMatchAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.includesMatchAny([{}, {}], [])
        })

        it("checks missing numbers", () => {
            fail("includesMatchAny", [1, 2, 3, 4, 5], 10)
            fail("includesMatchAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            fail("includesMatchAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesMatchAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesMatch()", () => {
        it("checks numbers", () => {
            fail("notIncludesMatch", [1, 2, 3, 4, 5], 1)
            fail("notIncludesMatch", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", () => {
            t.notIncludesMatch(["1", 2, 3, 4, 5], 1)
            t.notIncludesMatch(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", () => {
            fail("notIncludesMatch", [{foo: 1}, 3, "foo"], ["foo", 1])
            fail("notIncludesMatch", [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("notIncludesMatch", [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", () => {
            t.notIncludesMatch([{}, {}], [])
        })

        it("checks missing numbers", () => {
            t.notIncludesMatch([1, 2, 3, 4, 5], 10)
            t.notIncludesMatch([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", () => {
            t.notIncludesMatch([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesMatch", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })
})
