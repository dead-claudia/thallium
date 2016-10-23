'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
assert = require 'thallium/assert'
{root: create} = require 'thallium/internal'

t.test 'core (basic)', ->
    t.test 'reflect', ->
        t.test 'get parent', ->
            parent = -> @parent

            t.test 'works on the root instance', ->
                assert.equal create().call(parent), undefined

            t.test 'works on children', ->
                tt = create()
                methods = undefined
                tt.test 'test', -> methods = tt.call(parent).methods
                tt.run().then -> assert.equal methods, tt

        t.test 'get count', ->
            tt = create()
            count = -> @count
            check = (name, expected) ->
                found = tt.call(count)
                t.test name, -> assert.equal found, expected

            check 'works with 0 tests', 0
            tt.test 'test', ->
            check 'works with 1 test', 1
            tt.test 'test', ->
            check 'works with 2 tests', 2
            tt.test 'test', ->
            check 'works with 3 tests', 3

            # Test this test itself
            testCount = t.call count
            t.test 'works with itself', -> assert.equal testCount, 4

        t.test 'get name', ->
            name = -> @name

            t.test 'works with the root test', ->
                assert.equal create().call(name), undefined

            t.test 'works with child tests', ->
                tt = create()
                child = undefined
                tt.test 'test', -> child = tt.call name
                tt.run().then -> assert.equal child, 'test'

            t.test 'works with itself', ->
                assert.equal t.call(name), 'works with itself'

        t.test 'get index', ->
            tt = create()
            index = -> @index
            first = second = undefined

            t.test 'works with the root test', ->
                assert.equal tt.call(index), -1

            tt.test 'test', -> first = tt.call index
            tt.test 'test', -> second = tt.call index

            tt.run().then ->
                t.test 'works with the first child test', ->
                    assert.equal first, 0

                t.test 'works with the second child test', ->
                    assert.equal second, 1

                t.test 'works with itself', ->
                    assert.equal t.call(index), 3

        t.test 'get children', ->
            children = -> @children

            t.test 'works with 0 tests', ->
                tt = create()
                assert.match tt.call(children), []

            t.test 'works with 1 test', ->
                tt = create()
                test = undefined
                tt.test 'test', -> test = tt.call -> this
                tt.run().then ->
                    assert.match tt.call(children), [test]

            t.test 'works with 2 tests', ->
                tt = create()
                first = second = undefined
                tt.test 'first', -> first = tt.call -> this
                tt.test 'second', -> second = tt.call -> this
                tt.run().then ->
                    assert.match tt.call(children), [first, second]

            t.test 'returns a copy', ->
                tt = create()
                slice = tt.call(children)
                tt.test 'test', ->
                assert.match slice, []

    t.test 'test()', ->
        t.test 'returns a prototypal clone inside', ->
            tt = create()
            inner = undefined
            tt.test 'test', -> inner = this
            tt.run().then -> assert.equal Object.getPrototypeOf(inner), tt

    t.test 'run()', ->
        t.test 'runs child tests', ->
            tt = create()
            called = 0
            err = undefined

            tt.reporter (res) ->
                err = res.error if res.isFail
                return

            tt.test 'test', ->
                tt.test 'foo', -> called++

            tt.run().then ->
                assert.equal called, 1
                assert.notOk err
