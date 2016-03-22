'use strict'

export r = (type, value) -> {type, value}

canHaveProp = (value) ->
    value? and (typeof value == 'object' or typeof value == 'function')

export isThenable = -> canHaveProp it and typeof it.then == 'function'

# Note that `return` isn't checked because V8 only partially supports it
# natively.
export isIterator = -> canHaveProp it and typeof it.next == 'function'

# Make function binding as lightweight as possible.
export bind = (f, inst) -> -> f.apply inst, &
