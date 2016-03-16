"use strict"

var ArgumentError = require("../argument-error.js")
var m = require("../../messages.js")

// Parse out numbers where applicable
function formatArg(arg) {
    var start = /^[+-]/.test(arg) ? arg[0] : ""
    var factor = start === "-" ? -1 : 1

    if (start !== "") {
        arg = arg.slice(1)
    }

    if (/^0b[01]+$/i.test(arg)) return factor * parseInt(arg.slice(2), 2)
    if (/^0o[0-7]+$/i.test(arg)) return factor * parseInt(arg.slice(2), 8)
    if (/^0x[\da-f]+$/i.test(arg)) return factor * parseInt(arg.slice(2), 16)
    if (/^\d+$/.test(arg)) return factor * parseInt(arg, 10)
    if (/^\d+(\.\d*)?(e[+-]?\d+)?$/i.test(arg)) return factor * parseFloat(arg)

    return start + arg
}

module.exports = function (argv, start) {
    // Ensure there is at least one argument in between (i.e. the module
    // itself). Note that the start index is actually the first index after the
    // opening bracket.
    if (argv[start] === "]") {
        throw new ArgumentError(m("missing.cli.reporter.module"))
    }

    // Check for the closing bracket
    if (argv.indexOf("]", start) === -1) {
        throw new ArgumentError(m("missing.cli.reporter.close"))
    }

    var value = {
        module: argv[start++],
        args: {},
    }

    var last

    for (var i = start; i < argv.length; i++) {
        var arg = argv[i]

        if (arg === "]") {
            if (last != null) {
                value.args[last] = true
            }

            return {index: i, value: value}
        }

        if (arg === "--") {
            throw new ArgumentError(m("missing.cli.reporter.close"))
        }

        if (last != null) {
            if (/^--/.test(arg)) {
                value.args[last] = true
            } else {
                value.args[last] = formatArg(arg)
            }
        }

        if (/^--/.test(arg)) {
            last = arg.slice(2)
        } else {
            last = null
        }
    }

    throw new Error("unreachable")
}
