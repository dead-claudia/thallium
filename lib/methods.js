"use strict"

module.exports = function (Base, Super, methods) {
    if (typeof Super !== "function") {
        methods = Super
    } else if (Super != null) {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })
    }

    if (methods != null) {
        var keys = Object.keys(methods)

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k]
            var desc = Object.getOwnPropertyDescriptor(methods, key)

            desc.enumerable = false
            Object.defineProperty(Base.prototype, key, desc)
        }
    }
}
