"use strict"

exports.createError = function (methods) {
    var Class = methods.constructor

    Class.prototype = Object.create(Error.prototype)

    // This will also correctly define the constructor on the Error subclass.
    Object.keys(methods).forEach(function (key) {
        Object.defineProperty(Class.prototype, key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: methods[key],
        })
    })

    return Class
}

exports.recordStack = function (inst) {
    function setStack(stack) {
        Object.defineProperty(inst, "stack", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: stack,
        })
    }

    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(inst, inst.constructor)
    } else {
        Object.defineProperty(inst, "stack", {
            configurable: true,
            enumerable: true,
            get: function () {
                var e = new Error(inst.message)
                var stack

                e.name = inst.name
                setStack(stack = e.stack)
                return stack
            },
            set: setStack,
        })
    }
}
