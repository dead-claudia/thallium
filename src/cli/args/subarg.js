import ArgumentError from "../argument-error.js"
import m from "../../messages.js"

/**
 * This parses out numbers like 1 or 10.23e-5 into numbers, and returns the rest
 * as raw strings.
 */
function formatArg(arg) {
    if (arg === "true") return true
    if (arg === "false") return false
    if (arg === "null") return null

    const start = /^[+-]/.test(arg) ? arg[0] : ""
    const sign = start === "-" ? -1 : 1
    const rest = start === "" ? arg : arg.slice(1)

    if (/^0b[01]+$/i.test(rest)) return sign * parseInt(rest.slice(2), 2)
    if (/^0o[0-7]+$/i.test(rest)) return sign * parseInt(rest.slice(2), 8)
    if (/^0x[\da-f]+$/i.test(rest)) return sign * parseInt(rest.slice(2), 16)
    if (/^\d+$/.test(rest)) return sign * parseInt(rest, 10)
    if (/^\d+(\.\d*)?(e[+-]?\d+)?$/i.test(rest)) return sign * parseFloat(rest)

    return arg
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

    const module = argv[start]
    let argsObject = null
    let lastArg = null
    const args = []

    function prop(key, value) {
        if (argsObject == null) {
            args.push(lastArg = argsObject = {})
        }

        argsObject[key] = value
    }

    function value(value) {
        if (lastArg == null || lastArg === argsObject) {
            args.push(lastArg = value)
            argsObject = null
        } else if (Array.isArray(lastArg)) {
            lastArg.push(value)
        } else {
            args.pop()
            args.push(lastArg = [lastArg, value])
        }
    }

    function read(last, arg) {
        if (last != null) {
            if (/^--/.test(arg)) {
                prop(last, true)
                return arg.slice(2)
            } else {
                prop(last, formatArg(arg))
                return null
            }
        } else if (/^--/.test(arg)) {
            return arg.slice(2)
        } else {
            value(formatArg(arg))
            return null
        }
    }

    function run() {
        let end = false
        let last, i

        for (i = start + 1; i < argv.length; i++) {
            const arg = argv[i]

            // Laziness hack :)
            if (arg === "]") {
                if (last != null) {
                    prop(last, true)
                }

                break
            }

            if (end) {
                value(formatArg(arg))
                continue
            }

            if (arg === "--") {
                if (last != null) {
                    prop(last, true)
                }

                end = true
                last = null
            } else {
                last = read(last, arg)
            }
        }

        return {
            index: i,
            value: {module, args},
        }
    }

    return run()
}
