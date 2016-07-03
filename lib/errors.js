"use strict"

var Util = require("./util.js")

function setStack(inst, stack) {
    Object.defineProperty(inst, "stack", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: stack,
    })
}

exports.readStack = function (inst) {
    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(inst, inst.constructor)
    } else {
        Object.defineProperty(inst, "stack", {
            configurable: true,
            enumerable: true,
            get: function () {
                var e = new Error(this.message)

                e.name = this.name
                setStack(this, Util.getStack(e))
            },
            set: function (stack) {
                setStack(this, stack)
            },
        })
    }
}

// Note: this only permits two parts: a constructor and a name.
exports.defineError = function (es6, props) {
    if (Array.isArray(es6)) es6 = es6.join("\n")
    try {
        return new Function("'use strict';" + es6)() // eslint-disable-line no-new-func, max-len
    } catch (_) {
        var Base = props.constructor

        Base.prototype = Object.create(Error.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })

        Object.defineProperty(Base.prototype, "name", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: props.name,
        })

        return Base
    }
}
