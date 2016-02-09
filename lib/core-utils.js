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
        var x1, x2, x3, x4
        switch (arguments.length) {
        case 0: throw new TypeError("Expected at least a function!")
        case 1: defer(func, arg); return

        case 2:
            x1 = arguments[1]
            defer(function () {
                return func(x1)
            }, arg)
            return

        case 3:
            x1 = arguments[1]
            x2 = arguments[2]
            defer(function () {
                return func(x1, x2)
            }, arg)
            return

        case 4:
            x1 = arguments[1]
            x2 = arguments[2]
            x3 = arguments[3]
            defer(function () {
                return func(x1, x2, x3)
            }, arg)
            return

        case 5:
            x1 = arguments[1]
            x2 = arguments[2]
            x3 = arguments[3]
            x4 = arguments[4]
            defer(function () {
                return func(x1, x2, x3, x4)
            }, arg)
            return

        default:
            var args = rest.apply(null, arguments)
            defer(function () {
                return func.apply(null, args)
            }, arg)
        }
    }
}
