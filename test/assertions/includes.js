"use strict"

var t = require("../../index.js")
var fail = require("../../test-util/assertions.js").fail

suite("assertions (includes)", function () {
    suite("t.includes()", function () {
        test("checks numbers", function () {
            t.includes([1, 2, 3, 4, 5], 1)
            t.includes([1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            fail("includes", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includes([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includes([obj1, obj2, obj3], [obj1, obj2, obj3])

            fail("includes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.includes([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includes", [1, 2, 3, 4, 5], 10)
            fail("includes", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("includes", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includes", [obj1, obj2, obj3], [{}])
            fail("includes", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesAll()", function () {
        test("checks numbers", function () {
            fail("notIncludesAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.notIncludesAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("notIncludesAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesAll", [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.notIncludesAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.notIncludesAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesAll([1, 2, 3, 4, 5], 10)
            t.notIncludesAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    suite("t.includesAny()", function () {
        test("checks numbers", function () {
            t.includesAny([1, 2, 3, 4, 5], 1)
            t.includesAny([1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            fail("includesAny", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesAny([obj1, obj2, obj3], [obj1, obj2, obj3])

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.includesAny([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesAny", [1, 2, 3, 4, 5], 10)
            fail("includesAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}
            fail("includesAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesAny", [obj1, obj2, obj3], [{}])
            fail("includesAny", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludes()", function () {
        test("checks numbers", function () {
            fail("notIncludes", [1, 2, 3, 4, 5], 1)
            fail("notIncludes", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.notIncludes(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludes", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.notIncludes([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludes([1, 2, 3, 4, 5], 10)
            t.notIncludes([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludes([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludes([obj1, obj2, obj3], [{}])
            t.notIncludes([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesLoose()", function () {
        test("checks numbers", function () {
            t.includesLoose([1, 2, 3, 4, 5], 1)
            t.includesLoose([1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            t.includesLoose(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesLoose([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLoose([obj1, obj2, obj3], [obj1, obj2, obj3])

            fail("includesLoose", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.includesLoose([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesLoose", [1, 2, 3, 4, 5], 10)
            fail("includesLoose", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("includesLoose", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesLooseAll()", function () {
        test("checks numbers", function () {
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("notIncludesLooseAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLooseAll",
                [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.notIncludesLooseAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.notIncludesLooseAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesLooseAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    suite("t.includesAny()", function () {
        test("checks numbers", function () {
            t.includesLooseAny([1, 2, 3, 4, 5], 1)
            t.includesLooseAny([1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            t.includesLooseAny(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseAny([obj1, obj2, obj3], [obj1, obj2, obj3])

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.includesLooseAny([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesLooseAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}
            fail("includesLooseAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesLoose()", function () {
        test("checks numbers", function () {
            fail("notIncludesLoose", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLoose", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("notIncludesLoose", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLoose", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludesLoose",
                [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.notIncludesLoose([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesLoose([1, 2, 3, 4, 5], 10)
            t.notIncludesLoose([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.notIncludesLoose([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesDeep()", function () {
        test("checks numbers", function () {
            t.includesDeep([1, 2, 3, 4, 5], 1)
            t.includesDeep([1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            fail("includesDeep", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
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

        test("checks nothing", function () {
            t.includesDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesDeep", [1, 2, 3, 4, 5], 10)
            fail("includesDeep", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesDeepAll()", function () {
        test("checks numbers", function () {
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.notIncludesDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("notIncludesDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.notIncludesDeepAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.includesDeepAny()", function () {
        test("checks numbers", function () {
            t.includesDeepAny([1, 2, 3, 4, 5], 1)
            t.includesDeepAny([1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            fail("includesDeepAny", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.includesDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.includesDeepAny([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesDeepAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            fail("includesDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesDeep()", function () {
        test("checks numbers", function () {
            fail("notIncludesDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.notIncludesDeep(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            fail("notIncludesDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.notIncludesDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.notIncludesDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesLooseDeep()", function () {
        test("checks numbers", function () {
            t.includesLooseDeep([1, 2, 3, 4, 5], 1)
            t.includesLooseDeep([1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            t.includesLooseDeep(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.includesLooseDeep([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseDeep([obj1, obj2, obj3], [obj1, obj2, obj3])
            t.includesLooseDeep([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])

            t.includesLooseDeep([{foo: 1}, {bar: 2}, 3, "foo", {}], [{foo: 1}])
            t.includesLooseDeep([{foo: 1}, {bar: 2}, {}], [{bar: 2}, {}])
            t.includesLooseDeep([{foo: 1}, {bar: 2}, []], [[]])
        })

        test("checks nothing", function () {
            t.includesLooseDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesLooseDeep", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeep", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesLooseDeepAll()", function () {
        test("checks numbers", function () {
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("notIncludesLooseDeepAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.notIncludesLooseDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesLooseDeepAll(
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.notIncludesLooseDeepAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.notIncludesLooseDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesLooseDeepAll(
                [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.includesLooseDeepAny()", function () {
        test("checks numbers", function () {
            t.includesLooseDeepAny([1, 2, 3, 4, 5], 1)
            t.includesLooseDeepAny([1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            t.includesLooseDeepAny(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.includesLooseDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.includesLooseDeepAny([{}, {}], [])
        })

        test("checks missing numbers", function () {
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            fail("includesLooseDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesLooseDeep()", function () {
        test("checks numbers", function () {
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("notIncludesLooseDeep", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            fail("notIncludesLooseDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.notIncludesLooseDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.notIncludesLooseDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })
})
