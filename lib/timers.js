"use strict"

var queue = []

function pull() {
    // This optimization really helps engines speed up function
    // execution.
    var last = queue.shift()
    var func = last.func
    var args = last.args
    switch (args.length) {
    case 0: return func()
    case 1: return func(args[0])
    case 2: return func(args[0], args[1])
    case 3: return func(args[0], args[1], args[2])
    case 4: return func(args[0], args[1], args[2], args[3])
    default: return func.apply(undefined, args)
    }
}

function dispatcher(defer, arg) {
    return function (func) {
        // Don't actually allocate a callable closure. Just allocate
        // what is needed.
        var args = new Array(arguments.length - 1)
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i]
        }
        queue.push({func: func, args: args})
        // Even though this may not seem safe (the browser might call
        // things out of order), it is as long as the caller doesn't
        // rely on the order of execution of event loop primitives.
        defer(pull, arg)
    }
}

// Node 0.x need the dispatcher for nextTick, but the others accept
// raw arguments.
exports.nextTick = /^v0\./.test(process.version)
    ? dispatcher(process.nextTick)
    : process.nextTick

exports.poll = setImmediate
