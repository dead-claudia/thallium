"use strict"

module.exports = function (Base, Super, methods) {
    if (typeof Base !== "function") {
        throw new TypeError("Expected base to be a function")
    }

    if (typeof Super === "function") {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })
    } else {
        methods = Super
    }

    if (methods != null && typeof methods !== "object") {
        throw new TypeError("Expected methods to be an object if passed")
    }

    for (var key in methods) { // eslint-disable-line guard-for-in
        var desc = Object.getOwnPropertyDescriptor(methods, key)

        if (desc != null) {
            desc.enumerable = false
            Object.defineProperty(Base.prototype, key, desc)
        }
    }
}
