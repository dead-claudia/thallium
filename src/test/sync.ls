'use strict'

require! {
    './test': {Test}
    '../util/util': {r}
}

createSyncTest = ({init, construct}) -> (methods, name, index, callback) ->
    ret = Test! <<< {name, index, callback, init, parent: methods._}
    construct.call ret, methods
    ret

export InlineTest = createSyncTest do
    construct: (methods) !->
        # Initialize the test now, because the methods are immediately
        # returned, instead of being revealed through the callback.
        @inline = []
        @initializing = true
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

export BlockTest = createSyncTest do
    construct: (@methods) !->

    init: ->
        methods = Object.create @methods
        methods._ = @

        try
            @callback.call methods, methods
            r 'pass'
        catch e
            r 'fail', e
