'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
assert = require 'thallium/assert'
{root: create} = require 'thallium/internal'

t.test 'core (basic)', ->
    t.timeout = Infinity
    t.test 'reflect', ->
        t.test 'get reflect', ->
            t.test 'is equivalent to this/arg in tt.call()', ->
                tt = create()
                assert.equal tt.reflect, tt.call(-> this)
                assert.equal tt.reflect, tt.call((x) -> x)

        t.test 'get parent', ->
            parent = -> @parent

            t.test 'works on the root instance', ->
                assert.equal create().reflect.parent, undefined

            t.test 'works on children', ->
                tt = create()
                inner = undefined
                tt.reporter = -> # Don't print anything
                tt.test 'test', -> inner = tt.reflect.parent
                tt.runTree().then -> assert.equal inner, tt.reflect

        t.test 'get count', ->
            tt = create()
            tt.reporter = -> # Don't print anything
            check = (name, expected) ->
                found = tt.reflect.count
                t.test name, -> assert.equal found, expected

            check 'works with 0 tests', 0
            tt.test 'test', ->
            check 'works with 1 test', 1
            tt.test 'test', ->
            check 'works with 2 tests', 2
            tt.test 'test', ->
            check 'works with 3 tests', 3

            # Test this test itself
            testCount = t.reflect.count
            t.test 'works with itself', -> assert.equal testCount, 4

        t.test 'get name', ->
            t.test 'works with the root test', ->
                assert.equal create().reflect.name, undefined

            t.test 'works with child tests', ->
                tt = create()
                child = undefined
                tt.reporter = -> # Don't print anything
                tt.test 'test', -> child = tt.reflect.name
                tt.runTree().then -> assert.equal child, 'test'

            t.test 'works with itself', ->
                assert.equal t.reflect.name, 'works with itself'

        t.test 'get index', ->
            tt = create()
            first = second = undefined
            tt.reporter = -> # Don't print anything

            t.test 'works with the root test', ->
                assert.equal tt.reflect.index, undefined

            tt.test 'test', -> first = tt.reflect.index
            tt.test 'test', -> second = tt.reflect.index

            tt.runTree().then ->
                t.test 'works with the first child test', ->
                    assert.equal first, 0

                t.test 'works with the second child test', ->
                    assert.equal second, 1

                t.test 'works with itself', ->
                    assert.equal t.reflect.index, 3

        t.test 'get children', ->
            t.test 'works with 0 tests', ->
                tt = create()
                assert.match tt.reflect.children, []

            t.test 'works with 1 test', ->
                tt = create()
                test = undefined
                tt.reporter = -> # Don't print anything
                tt.test 'test', -> test = tt.reflect
                tt.runTree().then ->
                    assert.match tt.reflect.children, [test]

            t.test 'works with 2 tests', ->
                tt = create()
                first = second = undefined
                tt.reporter = -> # Don't print anything
                tt.test 'first', -> first = tt.reflect
                tt.test 'second', -> second = tt.reflect
                tt.runTree().then ->
                    assert.match tt.reflect.children, [first, second]

            t.test 'returns a copy', ->
                tt = create()
                slice = tt.reflect.children
                tt.test 'test', ->
                assert.match slice, []

    t.test 'run()', ->
        t.test 'runs child tests', ->
            tt = create()
            called = 0
            err = undefined

            tt.reporter = (res) ->
                err = res.error if res.isFail
                return

            tt.test 'test', ->
                tt.test 'foo', -> called++

            tt.runTree().then ->
                assert.equal called, 1
                assert.notOk err
