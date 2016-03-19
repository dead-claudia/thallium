import t from "../../src/index.js"
import {fail} from "../../test-util/assertions.js"

suite("assertions (includes)", () => {
    suite("t.includes()", () => {
        test("checks numbers", () => {
            t.includes([1, 2, 3, 4, 5], 1)
            t.includes([1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            fail("includes", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includes([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includes([obj1, obj2, obj3], [obj1, obj2, obj3])

            fail("includes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.includes([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includes", [1, 2, 3, 4, 5], 10)
            fail("includes", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includes", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includes", [obj1, obj2, obj3], [{}])
            fail("includes", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesAll()", () => {
        test("checks numbers", () => {
            fail("notIncludesAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            t.notIncludesAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesAll", [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.notIncludesAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.notIncludesAll([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesAll([1, 2, 3, 4, 5], 10)
            t.notIncludesAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    suite("t.includesAny()", () => {
        test("checks numbers", () => {
            t.includesAny([1, 2, 3, 4, 5], 1)
            t.includesAny([1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            fail("includesAny", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesAny([obj1, obj2, obj3], [obj1, obj2, obj3])

            t.includesAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.includesAny([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesAny", [1, 2, 3, 4, 5], 10)
            fail("includesAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesAny", [obj1, obj2, obj3], [{}])
            fail("includesAny", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludes()", () => {
        test("checks numbers", () => {
            fail("notIncludes", [1, 2, 3, 4, 5], 1)
            fail("notIncludes", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            t.notIncludes(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludes", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludes", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.notIncludes([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludes([1, 2, 3, 4, 5], 10)
            t.notIncludes([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludes([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludes([obj1, obj2, obj3], [{}])
            t.notIncludes([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesLoose()", () => {
        test("checks numbers", () => {
            t.includesLoose([1, 2, 3, 4, 5], 1)
            t.includesLoose([1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            t.includesLoose(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesLoose([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLoose([obj1, obj2, obj3], [obj1, obj2, obj3])

            fail("includesLoose", [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.includesLoose([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesLoose", [1, 2, 3, 4, 5], 10)
            fail("includesLoose", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesLoose", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [{}])
            fail("includesLoose", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesLooseAll()", () => {
        test("checks numbers", () => {
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            fail("notIncludesLooseAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesLooseAll", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLooseAll",
                [obj1, obj2, obj3], [obj1, obj2, obj3])

            t.notIncludesLooseAll([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.notIncludesLooseAll([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesLooseAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesAll([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [{}])
            t.notIncludesAll([obj1, obj2, obj3], [[]])
        })
    })

    suite("t.includesAny()", () => {
        test("checks numbers", () => {
            t.includesLooseAny([1, 2, 3, 4, 5], 1)
            t.includesLooseAny([1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            t.includesLooseAny(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj3])
            t.includesLooseAny([obj1, obj2, obj3], [obj1, obj2, obj3])

            t.includesLooseAny([obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.includesLooseAny([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesLooseAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("includesLooseAny", [obj1, obj2, 3, "foo", {}], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [{}])
            fail("includesLooseAny", [obj1, obj2, obj3], [[]])
        })
    })

    suite("t.notIncludesLoose()", () => {
        test("checks numbers", () => {
            fail("notIncludesLoose", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLoose", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            fail("notIncludesLoose", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            fail("notIncludesLoose", [obj1, 3, obj3, "foo"], [obj1, obj3])
            fail("notIncludesLoose", [obj1, obj2, obj3], [obj1, obj2, obj3])
            fail("notIncludesLoose",
                [obj1, 3, obj3, "foo"], [obj1, obj2, obj3])
        })

        test("checks nothing", () => {
            t.notIncludesLoose([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesLoose([1, 2, 3, 4, 5], 10)
            t.notIncludesLoose([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            const obj1 = {}
            const obj2 = {}
            const obj3 = {}

            t.notIncludesLoose([obj1, obj2, 3, "foo", {}], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [{}])
            t.notIncludesLoose([obj1, obj2, obj3], [[]])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesDeep()", () => {
        test("checks numbers", () => {
            t.includesDeep([1, 2, 3, 4, 5], 1)
            t.includesDeep([1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            fail("includesDeep", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
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

        test("checks nothing", () => {
            t.includesDeep([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesDeep", [1, 2, 3, 4, 5], 10)
            fail("includesDeep", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesDeepAll()", () => {
        test("checks numbers", () => {
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            t.notIncludesDeepAll(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            t.notIncludesDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            fail("notIncludesDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.notIncludesDeepAll([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesDeepAll([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.includesDeepAny()", () => {
        test("checks numbers", () => {
            t.includesDeepAny([1, 2, 3, 4, 5], 1)
            t.includesDeepAny([1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            fail("includesDeepAny", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            t.includesDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.includesDeepAny([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesDeepAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            fail("includesDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesDeep()", () => {
        test("checks numbers", () => {
            fail("notIncludesDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is strict", () => {
            t.notIncludesDeep(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            fail("notIncludesDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.notIncludesDeep([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            t.notIncludesDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    suite("t.includesLooseDeep()", () => {
        test("checks numbers", () => {
            t.includesLooseDeep([1, 2, 3, 4, 5], 1)
            t.includesLooseDeep([1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            t.includesLooseDeep(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
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

        test("checks nothing", () => {
            t.includesLooseDeep([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesLooseDeep", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeep", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[]])
            fail("includesLooseDeep", [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesLooseDeepAll()", () => {
        test("checks numbers", () => {
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeepAll", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            fail("notIncludesLooseDeepAll", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            t.notIncludesLooseDeepAll([{foo: 1}, 3, "foo"], ["foo", 1])
            t.notIncludesLooseDeepAll(
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeepAll",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.notIncludesLooseDeepAll([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeepAll([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            t.notIncludesLooseDeepAll([{foo: 1}, {bar: 2}, {}], [[]])
            t.notIncludesLooseDeepAll(
                [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.includesLooseDeepAny()", () => {
        test("checks numbers", () => {
            t.includesLooseDeepAny([1, 2, 3, 4, 5], 1)
            t.includesLooseDeepAny([1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            t.includesLooseDeepAny(["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            t.includesLooseDeepAny([{foo: 1}, 3, "foo"], ["foo", 1])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.includesLooseDeepAny([{}, {}], [])
        })

        test("checks missing numbers", () => {
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], 10)
            fail("includesLooseDeepAny", [1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            fail("includesLooseDeepAny", [{foo: 1}, {bar: 2}, {}], [[]])
            t.includesLooseDeepAny([{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })

    suite("t.notIncludesLooseDeep()", () => {
        test("checks numbers", () => {
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], 1)
            fail("notIncludesLooseDeep", [1, 2, 3, 4, 5], [1])
        })

        test("is loose", () => {
            fail("notIncludesLooseDeep", ["1", 2, 3, 4, 5], [1])
        })

        test("checks objects", () => {
            fail("notIncludesLooseDeep", [{foo: 1}, 3, "foo"], ["foo", 1])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 1}])

            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}], [{foo: 1}, {bar: 2}])
        })

        test("checks nothing", () => {
            t.notIncludesLooseDeep([{}, {}], [])
        })

        test("checks missing numbers", () => {
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], 10)
            t.notIncludesLooseDeep([1, 2, 3, 4, 5], [10])
        })

        test("checks missing objects", () => {
            t.notIncludesLooseDeep([{foo: 1}, {bar: 2}, {}], [[]])
            fail("notIncludesLooseDeep",
                [{foo: 1}, {bar: 2}, {}], [[], {foo: 1}])
        })
    })
})
