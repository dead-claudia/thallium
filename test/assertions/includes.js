"use strict"

describe("assertions (includes)", function () {
    describe("includes()", function () {
        it("checks numbers", function () {
            assert.includes([1, 2, 3, 4, 5], 1)
            assert.includes([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includes", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includes", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includes([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includes([obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail1("includes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.includes([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includes", [1, 2, 3, 4, 5], 10)
            Util.fail1("includes", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("includes", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail1("includes", [obj1, obj2, obj3], [{}])
            Util.fail1("includes", [obj1, obj2, obj3], [[]])
        })
    })

    describe("notIncludesAll()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesAll", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludesAll(["1", 2, 3, 4, 5], 1)
            assert.notIncludesAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("notIncludesAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            Util.fail1("notIncludesAll", [obj1, obj2, obj3], [obj1, obj2, obj3])
            assert.notIncludesAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.notIncludesAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesAll([1, 2, 3, 4, 5], 10)
            assert.notIncludesAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            assert.notIncludesAll([obj1, obj2, obj3], [{}])
            assert.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("includesAny()", function () {
        it("checks numbers", function () {
            assert.includesAny([1, 2, 3, 4, 5], 1)
            assert.includesAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includesAny", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includesAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includesAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includesAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            assert.includesAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.includesAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesAny", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("includesAny", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail1("includesAny", [obj1, obj2, obj3], [{}])
            Util.fail1("includesAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("notIncludes()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludes", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludes", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludes(["1", 2, 3, 4, 5], 1)
            assert.notIncludes(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj3])
            Util.fail1("notIncludes", [obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail1("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.notIncludes([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludes([1, 2, 3, 4, 5], 10)
            assert.notIncludes([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.notIncludes([obj1, obj2, 3, "foo", {}], [{}])
            assert.notIncludes([obj1, obj2, obj3], [{}])
            assert.notIncludes([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("includesLoose()", function () {
        it("checks numbers", function () {
            assert.includesLoose([1, 2, 3, 4, 5], 1)
            assert.includesLoose([1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            assert.includesLoose(["1", 2, 3, 4, 5], 1)
            assert.includesLoose(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includesLoose([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includesLoose([obj1, obj2, obj3], [obj1, obj2, obj3])
            Util.fail1("includesLoose",
                [obj1, 3, obj3, "foo"],
                [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.includesLoose([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesLoose", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesLoose", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("includesLoose", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail1("includesLoose", [obj1, obj2, obj3], [{}])
            Util.fail1("includesLoose", [obj1, obj2, obj3], [[]])
        })
    })

    describe("notIncludesLooseAll()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesLooseAll", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesLooseAll", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            Util.fail1("notIncludesLooseAll", ["1", 2, 3, 4, 5], 1)
            Util.fail1("notIncludesLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("notIncludesLooseAll",
                [obj1, 3, obj3, "foo"],
                [obj1, obj3])

            Util.fail1("notIncludesLooseAll",
                [obj1, obj2, obj3],
                [obj1, obj2, obj3])

            assert.notIncludesLooseAll(
                [obj1, 3, obj3, "foo"],
                [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.notIncludesLooseAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesLooseAll([1, 2, 3, 4, 5], 10)
            assert.notIncludesLooseAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.notIncludesLooseAll([obj1, obj2, 3, "foo", {}], [{}])
            assert.notIncludesLooseAll([obj1, obj2, obj3], [{}])
            assert.notIncludesLooseAll([obj1, obj2, obj3], [[]])
        })
    })

    describe("includesLooseAny()", function () {
        it("checks numbers", function () {
            assert.includesLooseAny([1, 2, 3, 4, 5], 1)
            assert.includesLooseAny([1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            assert.includesLooseAny(["1", 2, 3, 4, 5], 1)
            assert.includesLooseAny(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includesLooseAny([obj1, obj2, obj3], [obj1, obj2, obj3])
            assert.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.includesLooseAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesLooseAny", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesLooseAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("includesLooseAny", [obj1, obj2, 3, "foo", {}], [{}])
            Util.fail1("includesLooseAny", [obj1, obj2, obj3], [{}])
            Util.fail1("includesLooseAny", [obj1, obj2, obj3], [[]])
        })
    })

    describe("notIncludesLoose()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesLoose", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesLoose", [1, 2, 3, 4, 5], [1])
        })

        it("is loose", function () {
            Util.fail1("notIncludesLoose", ["1", 2, 3, 4, 5], 1)
            Util.fail1("notIncludesLoose", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            Util.fail1("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])

            Util.fail1("notIncludesLoose",
                [obj1, obj2, obj3],
                [obj1, obj2, obj3])

            Util.fail1("notIncludesLoose",
                [obj1, 3, obj3, "foo"],
                [obj1, obj2, obj3])
        })

        it("checks nothing", function () {
            assert.notIncludesLoose([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesLoose([1, 2, 3, 4, 5], 10)
            assert.notIncludesLoose([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.notIncludesLoose([obj1, obj2, 3, "foo", {}], [{}])
            assert.notIncludesLoose([obj1, obj2, obj3], [{}])
            assert.notIncludesLoose([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("includesDeep()", function () {
        it("checks numbers", function () {
            assert.includesDeep([1, 2, 3, 4, 5], 1)
            assert.includesDeep([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includesDeep", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includesDeep", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includesDeep([obj1, obj2, obj3], [obj1, obj2, obj3])
            assert.includesDeep([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            assert.includesDeep([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            assert.includesDeep([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            assert.includesDeep([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", function () {
            assert.includesDeep([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesDeep", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesDeep", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail1("includesDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            Util.fail1("includesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("notIncludesDeepAll()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesDeepAll", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesDeepAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludesDeepAll(["1", 2, 3, 4, 5], 1)
            assert.notIncludesDeepAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            assert.notIncludesDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])

            assert.notIncludesDeepAll(
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail1("notIncludesDeepAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.notIncludesDeepAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesDeepAll([1, 2, 3, 4, 5], 10)
            assert.notIncludesDeepAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            assert.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            assert.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("includesDeepAny()", function () {
        it("checks numbers", function () {
            assert.includesDeepAny([1, 2, 3, 4, 5], 1)
            assert.includesDeepAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includesDeepAny", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includesDeepAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            assert.includesDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            assert.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            assert.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.includesDeepAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesDeepAny", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesDeepAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail1("includesDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            assert.includesDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("notIncludesDeep()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesDeep", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesDeep", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludesDeep(["1", 2, 3, 4, 5], 1)
            assert.notIncludesDeep(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            Util.fail1("notIncludesDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            Util.fail1("notIncludesDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail1("notIncludesDeep",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.notIncludesDeep([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesDeep([1, 2, 3, 4, 5], 10)
            assert.notIncludesDeep([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            assert.notIncludesDeep([{foo: 1}, {bar: 2}, {}], [[]])

            Util.fail1("notIncludesDeep",
                [{foo: 1}, {bar: 2}, {}],
                [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    describe("includesMatch()", function () {
        it("checks numbers", function () {
            assert.includesMatch([1, 2, 3, 4, 5], 1)
            assert.includesMatch([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includesMatch", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includesMatch", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            assert.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj3])
            assert.includesMatch([obj1, obj2, obj3], [obj1, obj2, obj3])
            assert.includesMatch([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            assert.includesMatch([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            assert.includesMatch([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            assert.includesMatch([{foo: 1}, {bar: 2}, []], [[]])
        })

        it("checks nothing", function () {
            assert.includesMatch([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesMatch", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesMatch", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail1("includesMatch", [{foo: 1}, {bar: 2}, {}], [[]])
            Util.fail1("includesMatch", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("notIncludesMatchAll()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesMatchAll", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesMatchAll", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludesMatchAll(["1", 2, 3, 4, 5], 1)
            assert.notIncludesMatchAll(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            assert.notIncludesMatchAll([{foo: 1}, 3, "foo"], ["foo", 1])

            assert.notIncludesMatchAll(
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail1("notIncludesMatchAll",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.notIncludesMatchAll([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesMatchAll([1, 2, 3, 4, 5], 10)
            assert.notIncludesMatchAll([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            assert.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[]])
            assert.notIncludesMatchAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("includesMatchAny()", function () {
        it("checks numbers", function () {
            assert.includesMatchAny([1, 2, 3, 4, 5], 1)
            assert.includesMatchAny([1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            Util.fail1("includesMatchAny", ["1", 2, 3, 4, 5], 1)
            Util.fail1("includesMatchAny", ["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            assert.includesMatchAny([{foo: 1}, 3, "foo"], ["foo", 1])
            assert.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            assert.includesMatchAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.includesMatchAny([{}, {}], [])
        })

        it("checks missing numbers", function () {
            Util.fail1("includesMatchAny", [1, 2, 3, 4, 5], 10)
            Util.fail1("includesMatchAny", [1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            Util.fail1("includesMatchAny", [{foo: 1}, {bar: 2}, {}], [[]])
            assert.includesMatchAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    describe("notIncludesMatch()", function () {
        it("checks numbers", function () {
            Util.fail1("notIncludesMatch", [1, 2, 3, 4, 5], 1)
            Util.fail1("notIncludesMatch", [1, 2, 3, 4, 5], [1])
        })

        it("is strict", function () {
            assert.notIncludesMatch(["1", 2, 3, 4, 5], 1)
            assert.notIncludesMatch(["1", 2, 3, 4, 5], [1])
        })

        it("checks objects", function () {
            Util.fail1("notIncludesMatch", [{foo: 1}, 3, "foo"], ["foo", 1])

            Util.fail1("notIncludesMatch",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 1}])

            Util.fail1("notIncludesMatch",
                [{foo: 1}, {bar: 2}],
                [{foo: 1}, {bar: 2}])
        })

        it("checks nothing", function () {
            assert.notIncludesMatch([{}, {}], [])
        })

        it("checks missing numbers", function () {
            assert.notIncludesMatch([1, 2, 3, 4, 5], 10)
            assert.notIncludesMatch([1, 2, 3, 4, 5], [10])
        })

        it("checks missing objects", function () {
            assert.notIncludesMatch([{foo: 1}, {bar: 2}, {}], [[]])

            Util.fail1("notIncludesMatch",
                [{foo: 1}, {bar: 2}, {}],
                [[], {foo: 1}])
        })
    })
})
