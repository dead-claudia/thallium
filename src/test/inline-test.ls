'use strict'

require! {
    './test': {Test}
    '../util/util': {r}
}

export class InlineTest extends Test
    (methods, @name, @index) ->
        super!

        # Initialize the test now, because the methods are immediately
        # returned, instead of being revealed through the callback.

        @inline = []
        @initializing = true
        @parent = methods._
        @methods = Object.create methods
        @methods._ = @

    init: ->
        for {run, args} in @inline
            try
                run.apply void, args
            catch e
                # Stop immediately like what block tests do.
                return r 'fail', e

        r 'pass'
