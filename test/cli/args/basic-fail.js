"use strict"

var t = require("../../../index.js")
var parseArgs = require("../../../lib/cli/parse-args")
var ArgumentError = require("../../../lib/cli/argument-error")

describe("cli arguments (basic fail)", function () {
    function throws(str) {
        str = str.trim()
        var args = str ? str.split(/\s+/g) : []

        it("fails with missing argument for " + str, function () {
            t.throws(function () { parseArgs("base", args) }, ArgumentError)
        })
    }

    throws("-c")
    throws("--config")
    throws("--cwd")
    throws("-r")
    throws("--register")

    throws("-c --")
    throws("--config --")
    throws("--cwd --")
    throws("-r --")
    throws("--register --")
})
