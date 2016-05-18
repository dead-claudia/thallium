"use strict"

module.exports = function (Base, Super) {
    var methods = []

    if (typeof Super !== "function") {
        methods.push(Super)
    } else if (Super != null) {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", Base)
    }

    for (var i = 0; i < arguments.length; i++) {
        methods.push(arguments[i])
    }

    for (var j = 0; j < methods.length; j++) {
        var object = methods[j]
        var keys = Object.keys(object)

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k]
            var desc = Object.getOwnPropertyDescriptor(object, key)

            desc.enumerable = false
            Object.defineProperty(Base.prototype, key, desc)
        }
    }

    return Base
}
