"use strict"

var methods = require("./methods.js")

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
                setStack(this, e.stack)
            },
            set: function (stack) {
                setStack(this, stack)
            },
        })
    }
}

exports.define = function (es6, props) {
    if (Array.isArray(es6)) es6 = es6.join("\n")
    try {
        return new Function("'use strict';" + es6)() // eslint-disable-line no-new-func, max-len
    } catch (_) {
        var C = props.constructor

        delete props.constructor
        return methods(C, Error, props)
    }
}
