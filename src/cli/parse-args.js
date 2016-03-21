import * as path from "path"

import {m} from "../messages.js"
import {ArgumentError} from "./argument-error.js"

const hasOwn = Object.prototype.hasOwnProperty

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
const requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "register": true,
}

const aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "register",
}

/**
 * Serializes `argv` into a list of tokens.
 */
function serialize(argv) {
    const args = []
    let boolean = true

    function push(type, value) {
        args.push({type, value, boolean})
    }

    function pushFlag(arg) {
        boolean = !requiresValue[arg]
        push("flag", arg)
    }

    function shorthand(entry) {
        if (!boolean) {
            throw new Error("No value should be required yet")
        }

        let last

        for (const short of entry.slice(1)) {
            // If we're not yet done parsing the shorthand alias, then the
            // current binary option *clearly* won't have a value to use.
            if (!boolean) {
                throw new ArgumentError(m("missing.cli.shorthand", last))
            }

            // Silently ignore invalid flags.
            if (hasOwn.call(aliases, short)) {
                pushFlag(aliases[short])
            }

            last = short
        }
    }

    function rest(i) {
        if (!boolean) {
            throw new ArgumentError(m("missing.cli.shorthand", argv[i - 2]))
        }

        while (i < argv.length) {
            push("file", argv[i++])
        }
    }

    function value(value) {
        push("value", value)
        boolean = true
    }

    for (let i = 0; i < argv.length; i++) {
        const entry = argv[i]

        if (entry === "--") {
            rest(i + 1)
            break
        }

        // Allow anything other than `--` or in the value position. If it's a
        // mistake, this'll likely complain later, anyways.
        if (!boolean || entry[0] !== "-") {
            value(entry)
            continue
        }

        if (entry[1] !== "-") {
            shorthand(entry)
            continue
        }

        pushFlag(entry.slice(2))
    }

    return args
}

function arg(value = null) {
    return {passed: false, value}
}

function argSet(arg, value) {
    arg.passed = true
    arg.value = value
    return arg
}

function argPush(arg, value) {
    arg.passed = true
    arg.value.push(value)
    return arg
}

/**
 * Properties:
 *
 * config: The config file to use. The default is inferred from
 *         `${args.files[0]}/.techtonic.${ext}`, taking the first `ext` from
 *         `--register` or whatever's inferred from node-interpret.
 *
 * cwd: This changes the default current working directory. It defaults to the
 *      initial `process.cwd()`, although the unit tests do use internal hooks
 *      to change that default.
 *
 * register: A list of extensions + possible modules to register. This
 *           effectively disables much of the inferrence magic based on `cwd`,
 *           the first `files` glob, and `config` to come up with something
 *           sensible.
 *
 * files: A list of file globs to load.
 *
 * help: If set to `"simple"` or `"detailed"`, display the help prompt.
 */
function initArgs(cwd) {
    return {
        config: arg(),
        cwd: arg(cwd),
        register: arg([]),
        files: arg([]),
        help: arg(),
    }
}

const types = {
    flag(args, arg) {
        if (arg.value === "help") {
            argSet(args.help, "simple")
        } else if (arg.value === "help-detailed") {
            argSet(args.help, "detailed")
        } else {
            return arg
        }

        return undefined
    },

    value(args, arg, last) {
        if (last === undefined) {
            argPush(args.files, arg.value)
            // Silently ignore invalid arguments
        } else if (hasOwn.call(args, last.value)) {
            const current = args[last.value]

            if (Array.isArray(current.value)) {
                argPush(current, arg.value)
            } else if (last.boolean) {
                argSet(current, true)
            } else {
                argSet(current, arg.value)
            }
        }
    },

    file(args, arg) {
        argPush(args.files, arg.value)
    },
}

export function parseArgs(cwd, argv) {
    const args = initArgs(cwd)
    const last = serialize(argv).reduce(
        (last, arg) => types[arg.type](args, arg, last),
        undefined)

    if (last !== undefined && !last.boolean) {
        throw new ArgumentError(m("missing.cli.argument", last.value))
    }

    if (args.files.value.length === 0) {
        args.files.value = [path.join("test", "**")]
    }

    return args
}
