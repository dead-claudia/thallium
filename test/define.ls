'use strict'

require! '../src/index': {t}

suite 'define()', !->
    test 'exists', !->
        tt = t.base!
        t.hasKey tt, 'define'
        t.function tt.define

    test 'works with string + function', !->
        tt = t.base!
        self = void

        tt.define 'assert', (test, expected, actual) ->
            self := @
            test: test
            expected: expected
            actual: actual
            message: '{expected} :: {actual}'

        tt.assert true, {}, {}
        t.undefined self

        expected = {}
        actual = {}

        try
            tt.assert(false, expected, actual)
        catch e
            t.undefined self
            t.instanceof e, t.AssertionError
            t.hasKeys e,
                expected: expected
                actual: actual
                message: '{} :: {}'
            return

        throw new t.AssertionError 'Expected tt.assert to throw an error'

    test 'works with object', !->
        tt = t.base!
        self = void

        tt.define do
            assert: (test, expected, actual) ->
                self := @
                test: test
                expected: expected
                actual: actual
                message: '{expected} :: {actual}'

        tt.assert true, {}, {}
        t.undefined self

        expected = {}
        actual = {}
        message = '{} :: {}'

        try
            tt.assert(false, expected, actual)
        catch e
            t.undefined self
            t.instanceof e, t.AssertionError
            t.hasKeys e, {expected, actual, message}
            return

        throw new t.AssertionError 'Expected tt.assert to throw an error'

    test 'allows arbitrary properties to be used in the message', !->
        tt = t.base!

        tt.define 'assert', (test, extra) -> {test, extra, message: '{extra}'}

        try
            tt.assert false, 'message'
        catch e
            t.instanceof e, t.AssertionError
            t.hasKeys e,
                expected: void
                actual: void
                message: '\'message\''
            return

        throw new t.AssertionError 'Expected tt.assert to throw an error'
