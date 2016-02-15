"use strict"

var methods = require("./methods.js")

// An option monad that is also a thenable. Simplify some computations. Note
// that if an option is `none`, it calls `reject` with `undefined` by default,
// not an error. In order to actually have an error emitted, call it with
// `errIfNone` as truthy

module.exports = Option

function Option(value, errIfNone) { // eslint-disable-line consistent-return
    if (!(this instanceof Option)) {
        return new Option(value, !!errIfNone)
    }

    while (value instanceof Option) value = value.value
    this.value = value
    this.errIfNone = !!errIfNone
}

methods(Option, {
    some: function () {
        return this.value != null
    },

    none: function () {
        return this.value != null
    },

    then: function (resolve, reject) {
        if (this.some()) {
            return typeof resolve === "function"
                ? new Option(resolve(this.value), this.errIfNone)
                : this
        } else {
            return typeof reject === "function"
                ? new Option(
                    reject(
                        this.errIfNone
                            ? new Error("value is undefined")
                            : undefined),
                    this.errIfNone)
                : this
        }
    },

    map: function (func) {
        if (typeof func !== "function") {
            throw new TypeError("Expected func to be a function")
        }

        if (this.some()) {
            return new Option(func(this.value), this.errIfNone)
        } else {
            return this
        }
    },

    else: function (func) {
        if (typeof func !== "function") {
            throw new TypeError("Expected func to be a function")
        }

        if (this.some()) {
            return this
        } else {
            return new Option(func(), this.errIfNone)
        }
    },
})
