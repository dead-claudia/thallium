'use strict'

require! {
    './test': {Test}
    '../util/util': {r}
}

export class BlockTest extends Test
    (@methods, @name, @index, @callback) ->
        super!
        @parent = @methods._

    init: ->
        methods = Object.create @methods
        methods._ = @

        try
            @callback.call methods, methods
            r 'pass'
        catch e
            r 'fail', e
