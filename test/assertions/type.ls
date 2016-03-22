'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/assertions': {fail, basic}
}

suite 'assertions (type)', !->
    suite 't.type()', !->
        test 'checks good types', !->
            t.type true, 'boolean'
            t.type false, 'boolean'
            t.type 0, 'number'
            t.type 1, 'number'
            t.type NaN, 'number'
            t.type Infinity, 'number'
            t.type 'foo', 'string'
            t.type '', 'string'
            t.type null, 'object'
            t.type {}, 'object'
            t.type [], 'object'
            t.type (!->), 'function'
            t.type void, 'undefined'
            t.type Symbol!, 'symbol' if typeof Symbol == 'function'

        test 'checks bad types', !->
            fail 'type', true, 'nope'
            fail 'type', false, 'nope'
            fail 'type', 0, 'nope'
            fail 'type', 1, 'nope'
            fail 'type', NaN, 'nope'
            fail 'type', Infinity, 'nope'
            fail 'type', 'foo', 'nope'
            fail 'type', '', 'nope'
            fail 'type', null, 'nope'
            fail 'type', {}, 'nope'
            fail 'type', [], 'nope'
            fail 'type', (!->), 'nope'
            fail 'type', void, 'nope'
            fail 'type', Symbol!, 'nope' if typeof Symbol == 'function'

    suite 't.notType()', !->
        test 'checks good types', !->
            fail 'notType', true, 'boolean'
            fail 'notType', false, 'boolean'
            fail 'notType', 0, 'number'
            fail 'notType', 1, 'number'
            fail 'notType', NaN, 'number'
            fail 'notType', Infinity, 'number'
            fail 'notType', 'foo', 'string'
            fail 'notType', '', 'string'
            fail 'notType', null, 'object'
            fail 'notType', {}, 'object'
            fail 'notType', [], 'object'
            fail 'notType', (!->), 'function'
            fail 'notType', void, 'undefined'
            fail 'notType', Symbol!, 'symbol' if typeof Symbol == 'function'

        test 'checks bad types', !->
            t.notType true, 'nope'
            t.notType false, 'nope'
            t.notType 0, 'nope'
            t.notType 1, 'nope'
            t.notType NaN, 'nope'
            t.notType Infinity, 'nope'
            t.notType 'foo', 'nope'
            t.notType '', 'nope'
            t.notType null, 'nope'
            t.notType {}, 'nope'
            t.notType [], 'nope'
            t.notType (!->), 'nope'
            t.notType void, 'nope'
            t.notType Symbol!, 'nope' if typeof Symbol == 'function'

    testType = (name, callback) ->
        basic "t.#{name}()", !->
            callback (-> t[name] ...&), (-> fail name, ...&)

        negated = "not#{name.0.toUpperCase! + name.slice 1}"

        basic "t.#{negated}()", !->
            callback (-> fail negated, ...&), (-> t[negated] ...&)

    testType 'boolean', (good, bad) !->
        good true
        good false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'number', (good, bad) !->
        bad true
        bad false
        good 0
        good 1
        good NaN
        good Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'function', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        good !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'object', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        good null
        good {}
        good []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'string', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        good 'foo'
        good ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'symbol', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        good Symbol! if typeof Symbol == 'function'

    testType 'undefined', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        good void
        good!
        bad Symbol! if typeof Symbol == 'function'

    testType 'true', (good, bad) !->
        good true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'false', (good, bad) !->
        bad true
        good false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'null', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        good null
        bad {}
        bad []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    testType 'array', (good, bad) !->
        bad true
        bad false
        bad 0
        bad 1
        bad NaN
        bad Infinity
        bad 'foo'
        bad ''
        bad null
        bad {}
        good []
        bad !->
        bad void
        bad!
        bad Symbol! if typeof Symbol == 'function'

    basic 't.instanceof()', !->
        class A
        t.instanceof new A, A
        t.instanceof new A, Object

        class B extends A

        t.instanceof new B, B
        t.instanceof new B, A

        fail 'instanceof', new A, B
        fail 'instanceof', [], RegExp

    basic 't.notInstanceof()', !->
        class A
        fail 'notInstanceof', new A, A
        fail 'notInstanceof', new A, Object

        class B extends A

        fail 'notInstanceof', new B, B
        fail 'notInstanceof', new B, A

        t.notInstanceof new A, B
        t.notInstanceof [], RegExp
