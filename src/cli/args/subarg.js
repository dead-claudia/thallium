import ArgumentError from "../argument-error.js"
import m from "../../messages.js"

/**
 * This parses out numbers like 1 or 10.23e-5 into numbers, and returns the rest
 * as raw strings.
 */
function formatArg(arg) {
    const start = /^[+-]/.test(arg) ? arg[0] : ""
    const factor = start === "-" ? -1 : 1

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

/**
 * Parse out a single subarg and return it as a `{value, args}` object, where
 * `value` is the module name and `args` is a hash of the appropriate arguments
 * passed. Note that `start` is actually the first index after the opening
 * bracket.
 */
export default function (argv, start) {
    // Assert there's at least one argument in between (i.e. the module itself).
    if (argv[start] === "]") {
        throw new ArgumentError(m("missing.cli.reporter.module"))
    }

    // Check for the closing bracket
    if (argv.indexOf("]", start) === -1) {
        throw new ArgumentError(m("missing.cli.reporter.close"))
    }

    const value = {
        module: argv[start++],
        args: {},
    }

    let last

    for (let i = start; i < argv.length; i++) {
        const arg = argv[i]

        if (arg === "]") {
            if (last != null) {
                value.args[last] = true
            }

            return {index: i, value}
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
