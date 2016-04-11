"use strict"

/* eslint-env mocha */

const t = require("../index.js")

exports.fail = function (name) {
    const args = []

    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    t.throws(() => { t[name].apply(t, args) }, t.AssertionError)
}

exports.basic = (desc, callback) => describe(desc, () => it("works", callback))
