'use strict'

require! {
    bluebird: Promise
    '../util/util': {isThenable}
}

export activeReporters = (ctx) ->
    until ctx.reporters?
        ctx = ctx.parent
    ctx.reporters

# This is uncached, so reporters can expect a new object each time.
getPath = (ctx) ->
    ret = []

    until ctx.isBase
        ret.unshift do
            name: ctx.name
            index: ctx.index
        ctx = ctx.parent

    ret

maybePromisify = (func, value) ->
    new Promise (resolve, reject) ->
        res = func value, (err) ->
            if err? then reject err else resolve!
        resolve res if isThenable res

export report = (ctx, args) ->
    # Reporters are allowed to block, and these are always called first.
    blocking = []
    concurrent = []

    for reporter in activeReporters ctx
        if reporter.block
            blocking.push reporter
        else
            concurrent.push reporter

    pcall = (reporter) ->
        maybePromisify reporter,
            type: args.type
            value: args.value
            path: getPath ctx

    Promise.map concurrent, pcall
    .return blocking
    .each pcall
    .return void

export runTests = (ctx, res) ->
    # If the init failed, then this has already failed.
    if res.type != 'pass'
        Promise.resolve res
    else
        # Tests are called in sequence for obvious reasons.
        Promise.each ctx.tests, (-> it.run false) .return res
