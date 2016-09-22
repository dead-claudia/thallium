"use strict"

describe("assertions (includes)", function () {
    describe("t.includes()", function () {
        it("checks numbers", function () {
            t.includes([1, 2, 3, 4, 5], 1)
            t.includes([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includes", ["1", 2, 3, 4, 5], 1)
            Util.fail("includes", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includes([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includes([obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail("includes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.includes([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includes", [1, 2, 3, 4, 5], 10)
            Util.fail("includes", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("includes", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail("includes", [obj1, obj2, obj3], [{}])
            Util.fail("includes", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesAll()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesAll", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludesAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("notIncludesAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            Util.fail("notIncludesAll", [obj1, obj2, obj3], [obj1, obj2, obj3])
            t.notIncludesAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.notIncludesAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesAll([1, 2, 3, 4, 5], 10)
            t.notIncludesAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("t.includesAny()", function () {
        it("checks numbers", function () {
            t.includesAny([1, 2, 3, 4, 5], 1)
            t.includesAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includesAny", ["1", 2, 3, 4, 5], 1)
            Util.fail("includesAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.includesAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesAny", [1, 2, 3, 4, 5], 10)
            Util.fail("includesAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("includesAny", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail("includesAny", [obj1, obj2, obj3], [{}])
            Util.fail("includesAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludes()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludes", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludes", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludes(["1", 2, 3, 4, 5], 1)
            t.notIncludes(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj3])
            Util.fail("notIncludes", [obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.notIncludes([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludes([1, 2, 3, 4, 5], 10)
            t.notIncludes([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludes([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludes([obj1, obj2, obj3], [{}])
            t.notIncludes([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesLoose()", function () {
        it("checks numbers", function () {
            t.includesLoose([1, 2, 3, 4, 5], 1)
            t.includesLoose([1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            t.includesLoose(["1", 2, 3, 4, 5], 1)
            t.includesLoose(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesLoose([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLoose([obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail("includesLoose",
                [obj1, 3, obj3, "foo"],
                [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.includesLoose([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesLoose", [1, 2, 3, 4, 5], 10)
            Util.fail("includesLoose", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("includesLoose", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail("includesLoose", [obj1, obj2, obj3], [{}])
            Util.fail("includesLoose", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesLooseAll()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesLooseAll", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesLooseAll", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            Util.fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], 1)
            Util.fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("notIncludesLooseAll",
                [obj1, 3, obj3, "foo"],
                [obj1, obj3])

            Util.fail("notIncludesLooseAll",
                [obj1, obj2, obj3],
                [obj1, obj2, obj3])

            t.notIncludesLooseAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.notIncludesLooseAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesLooseAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesLooseAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLooseAll([obj1, obj2, obj3], [{}])
            t.notIncludesLooseAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("t.includesLooseAny()", function () {
        it("checks numbers", function () {
            t.includesLooseAny([1, 2, 3, 4, 5], 1)
            t.includesLooseAny([1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            t.includesLooseAny(["1", 2, 3, 4, 5], 1)
            t.includesLooseAny(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.includesLooseAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesLooseAny", [1, 2, 3, 4, 5], 10)
            Util.fail("includesLooseAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("includesLooseAny", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail("includesLooseAny", [obj1, obj2, obj3], [{}])
            Util.fail("includesLooseAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("t.notIncludesLoose()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesLoose", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesLoose", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            Util.fail("notIncludesLoose", ["1", 2, 3, 4, 5], 1)
            Util.fail("notIncludesLoose", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])

            Util.fail("notIncludesLoose",
                [obj1, obj2, obj3],
                [obj1, obj2, obj3])

            Util.fail("notIncludesLoose",
                [obj1, 3, obj3, "foo"],
                [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            t.notIncludesLoose([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesLoose([1, 2, 3, 4, 5], 10)
            t.notIncludesLoose([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesLoose([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesDeep()", function () {
        it("checks numbers", function () {
            t.includesDeep([1, 2, 3, 4, 5], 1)
            t.includesDeep([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includesDeep", ["1", 2, 3, 4, 5], 1)
            Util.fail("includesDeep", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesDeep([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesDeep([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesDeep([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesDeep([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", function () {
            t.includesDeep([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesDeep", [1, 2, 3, 4, 5], 10)
            Util.fail("includesDeep", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            Util.fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesDeepAll()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesDeepAll", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesDeepAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            t.notIncludesDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            Util.fail("notIncludesDeepAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.notIncludesDeepAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesDeepAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.includesDeepAny()", function () {
        it("checks numbers", function () {
            t.includesDeepAny([1, 2, 3, 4, 5], 1)
            t.includesDeepAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includesDeepAny", ["1", 2, 3, 4, 5], 1)
            Util.fail("includesDeepAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            t.includesDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.includesDeepAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesDeepAny", [1, 2, 3, 4, 5], 10)
            Util.fail("includesDeepAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail("includesDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesDeep()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesDeep", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesDeep", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludesDeep(["1", 2, 3, 4, 5], 1)
            t.notIncludesDeep(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            Util.fail("notIncludesDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            Util.fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.notIncludesDeep([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesDeep([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            t.notIncludesDeep([{foo: 1}, {bar: 2}, {}], [[]])

            Util.fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}, {}],
                [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("t.includesMatch()", function () {
        it("checks numbers", function () {
            t.includesMatch([1, 2, 3, 4, 5], 1)
            t.includesMatch([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includesMatch", ["1", 2, 3, 4, 5], 1)
            Util.fail("includesMatch", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesMatch([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesMatch([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesMatch([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesMatch([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", function () {
            t.includesMatch([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesMatch", [1, 2, 3, 4, 5], 10)
            Util.fail("includesMatch", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail("includesMatch", [{foo: 1}, {bar: 2}, {}], [[]])
            Util.fail("includesMatch", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesMatchAll()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesMatchAll", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesMatchAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludesMatchAll(["1", 2, 3, 4, 5], 1)
            t.notIncludesMatchAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            t.notIncludesMatchAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            Util.fail("notIncludesMatchAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.notIncludesMatchAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesMatchAll([1, 2, 3, 4, 5], 10)
            t.notIncludesMatchAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.includesMatchAny()", function () {
        it("checks numbers", function () {
            t.includesMatchAny([1, 2, 3, 4, 5], 1)
            t.includesMatchAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail("includesMatchAny", ["1", 2, 3, 4, 5], 1)
            Util.fail("includesMatchAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            t.includesMatchAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.includesMatchAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail("includesMatchAny", [1, 2, 3, 4, 5], 10)
            Util.fail("includesMatchAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail("includesMatchAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesMatchAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("t.notIncludesMatch()", function () {
        it("checks numbers", function () {
            Util.fail("notIncludesMatch", [1, 2, 3, 4, 5], 1)
            Util.fail("notIncludesMatch", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            t.notIncludesMatch(["1", 2, 3, 4, 5], 1)
            t.notIncludesMatch(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            Util.fail("notIncludesMatch", [{foo: 1}, 3, "foo"], ["foo", 1])

            Util.fail("notIncludesMatch",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail("notIncludesMatch",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            t.notIncludesMatch([{}, {}], [])
        })

        it("checks missing numbers", function () {
            t.notIncludesMatch([1, 2, 3, 4, 5], 10)
            t.notIncludesMatch([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            t.notIncludesMatch([{foo: 1}, {bar: 2}, {}], [[]])

            Util.fail("notIncludesMatch",
                [{foo: 1}, {bar: 2}, {}],
                [[], {foo: 1}])
        })
    })
})
