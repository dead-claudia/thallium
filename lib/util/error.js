"use strict"

exports.createError = function (es6Str, methods) {
    try {
        return new Function(es6Str)() // eslint-disable-line no-new-func
    } catch (_) {
        var Class = methods.constructor

        Class.prototype = Object.create(Error.prototype)

        // This will also correctly define the constructor on the Error
        // subclass.
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
        // Lazily create the stack
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
