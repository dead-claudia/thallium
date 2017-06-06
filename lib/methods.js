"use strict"

module.exports = function (Base, Super) {
    if (typeof Base !== "function") {
        throw new TypeError("Expected base to be a function")
    }

    var start = 2

    if (typeof Super === "function") {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })
    } else {
        start = 1
    }

    for (var i = start; i < arguments.length; i++) {
        var methods = arguments[i]

        if (methods != null) {
            if (typeof methods !== "object") {
                throw new TypeError("Expected methods to be an object")
            }

            var keys = Object.keys(methods)

            for (var k = 0; k < keys.length; k++) {
                var key = keys[k]
                var desc = Object.getOwnPropertyDescriptor(methods, key)

                desc.enumerable = false
                Object.defineProperty(Base.prototype, key, desc)
            }
        }
    }
}
