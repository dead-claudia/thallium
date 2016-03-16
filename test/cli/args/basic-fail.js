"use strict"

var t = require("../../../index.js")
var parseArgs = require("../../../lib/cli/parse-args.js")
var ArgumentError = require("../../../lib/cli/argument-error.js")

suite("cli arguments (subarg)", function () {
    function throws(str) {
        var args = /^\s+$/.test(str) ? [] : str.split(/\s+/g)

        test("fails with missing argument for " + str, function () {
            t.throws(function () { parseArgs("base", args) }, ArgumentError)
        })
    }

    throws("-c")
    throws("--config")
    throws("--cwd")
    throws("-m")
    throws("--module")
    throws("-r")
    throws("--register")
    throws("-R")
    throws("--reporter")

    throws("-c --")
    throws("--config --")
    throws("--cwd --")
    throws("-m --")
    throws("--module --")
    throws("-r --")
    throws("--register --")
    throws("-R --")
    throws("--reporter --")
})
