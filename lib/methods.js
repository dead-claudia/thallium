"use strict"

module.exports = function (Class, Super, methods) {
    if (methods == null) {
        methods = Super
        Super = null
    }

    if (Super != null) {
        Class.prototype = Object.create(Super.prototype)
        Object.defineProperty(Class.prototype, "constructor", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: Class,
        })
    }

    // It's still guarded. The spec uses getOwnPropertyDescriptor +
    // `=== undefined`, so this is still roughly equivalent. We need the
    // descriptor to copy getters and setters.
    for (var i in methods) { // eslint-disable-line guard-for-in
        var desc = Object.getOwnPropertyDescriptor(methods, i)
        if (desc != null) {
            // This should always remain false
            desc.enumerable = false
            Object.defineProperty(Class.prototype, i, desc)
        }
    }

    // Just in case this is even needed.
    return Class
}
