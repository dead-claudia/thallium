'use strict'

export class ArgumentError extends Error
    (@message) ->
        | typeof Error.captureStackTrace == 'function' =>
            Error.captureStackTrace @, ArgumentError
        | otherwise =>
            e = new Error @message
            e.name = @name
            @stack = e.stack

    name: 'ArgumentError'
