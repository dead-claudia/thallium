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

    suite("t.doesNotIncludeAll()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeAll", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.doesNotIncludeAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("doesNotIncludeAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("doesNotIncludeAll", [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.doesNotIncludeAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.doesNotIncludeAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeAll([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.doesNotIncludeAll([obj1, obj2, 3, "foo", {}], [{}])
            t.doesNotIncludeAll([obj1, obj2, obj3], [{}])
            t.doesNotIncludeAll([obj1, obj2, obj3], [[]])
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

    suite("t.doesNotInclude()", function () {
        test("checks numbers", function () {
            fail("doesNotInclude", [1, 2, 3, 4, 5], 1)
            fail("doesNotInclude", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.doesNotInclude(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("doesNotInclude", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("doesNotInclude", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("doesNotInclude", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.doesNotInclude([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotInclude([1, 2, 3, 4, 5], 10)
            t.doesNotInclude([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.doesNotInclude([obj1, obj2, 3, "foo", {}], [{}])
            t.doesNotInclude([obj1, obj2, obj3], [{}])
            t.doesNotInclude([obj1, obj2, obj3], [[]])
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

    suite("t.doesNotIncludeLooseAll()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeLooseAll", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeLooseAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("doesNotIncludeLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("doesNotIncludeLooseAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("doesNotIncludeLooseAll",
                [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.doesNotIncludeLooseAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.doesNotIncludeLooseAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeLooseAll([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeLooseAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.doesNotIncludeAll([obj1, obj2, 3, "foo", {}], [{}])
            t.doesNotIncludeAll([obj1, obj2, obj3], [{}])
            t.doesNotIncludeAll([obj1, obj2, obj3], [[]])
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

    suite("t.doesNotIncludeLoose()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeLoose", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeLoose", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("doesNotIncludeLoose", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            fail("doesNotIncludeLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("doesNotIncludeLoose", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("doesNotIncludeLoose",
                [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", function () {
            t.doesNotIncludeLoose([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeLoose([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeLoose([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            var obj1 = {}
            var obj2 = {}
            var obj3 = {}

            t.doesNotIncludeLoose([obj1, obj2, 3, "foo", {}], [{}])
            t.doesNotIncludeLoose([obj1, obj2, obj3], [{}])
            t.doesNotIncludeLoose([obj1, obj2, obj3], [[]])
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

    suite("t.doesNotIncludeDeepAll()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeDeepAll", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.doesNotIncludeDeepAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.doesNotIncludeDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.doesNotIncludeDeepAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("doesNotIncludeDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.doesNotIncludeDeepAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeDeepAll([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.doesNotIncludeDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.doesNotIncludeDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
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

    suite("t.doesNotIncludeDeep()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeDeep", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", function () {
            t.doesNotIncludeDeep(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            fail("doesNotIncludeDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("doesNotIncludeDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("doesNotIncludeDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.doesNotIncludeDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeDeep([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.doesNotIncludeDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("doesNotIncludeDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
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

    suite("t.doesNotIncludeLooseDeepAll()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeLooseDeepAll", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeLooseDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("doesNotIncludeLooseDeepAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            t.doesNotIncludeLooseDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.doesNotIncludeLooseDeepAll(
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("doesNotIncludeLooseDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.doesNotIncludeLooseDeepAll([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeLooseDeepAll([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeLooseDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.doesNotIncludeLooseDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.doesNotIncludeLooseDeepAll(
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

    suite("t.doesNotIncludeLooseDeep()", function () {
        test("checks numbers", function () {
            fail("doesNotIncludeLooseDeep", [1, 2, 3, 4, 5], 1)
            fail("doesNotIncludeLooseDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", function () {
            fail("doesNotIncludeLooseDeep", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", function () {
            fail("doesNotIncludeLooseDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("doesNotIncludeLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("doesNotIncludeLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", function () {
            t.doesNotIncludeLooseDeep([{}, {}], [])
        })

        test("checks missing numbers", function () {
            t.doesNotIncludeLooseDeep([1, 2, 3, 4, 5], 10)
            t.doesNotIncludeLooseDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", function () {
            t.doesNotIncludeLooseDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("doesNotIncludeLooseDeep",
                [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })
})
