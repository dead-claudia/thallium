"use strict"

exports.rest = rest

/** @this {number} The start index */
function rest() {
    var i
    if (this == null) {
        var args = new Array(arguments.length)
        for (i = 0; i < arguments.length; i++) args[i] = arguments[i]
        return args
    } else {
        for (i = 0; i < arguments.length; i++) this.push(arguments[i])
        return this
    }
}

exports.dispatcher = function (defer, arg) {
    return function (func) {
        var x0, x1, x2, x3
        switch (arguments.length) {
        case 0: throw new TypeError("Expected at least a function!")
        case 1: defer(func, arg); return

        case 2:
            x0 = arguments[0]
            defer(function () { return func(x0) }, arg)
            return

        case 3:
            x0 = arguments[0]
            x1 = arguments[1]
            defer(function () { return func(x0, x1) }, arg)
            return

        case 4:
            x0 = arguments[0]
            x1 = arguments[1]
            x2 = arguments[2]
            defer(function () { return func(x0, x1, x2) }, arg)
            return

        case 5:
            x0 = arguments[0]
            x1 = arguments[1]
            x2 = arguments[2]
            x3 = arguments[3]
            defer(function () { return func(x0, x1, x2, x3) }, arg)
            return

        default:
            var args = rest.apply(null, arguments)
            defer(function () { return func.apply(null, args) }, arg)
        }
    }
}
