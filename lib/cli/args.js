"use strict"

const m = require("../messages.js")

const hasOwn = Object.prototype.hasOwnProperty

class ArgumentError extends Error {
    get name() {
        return "ArgumentError"
    }
}
exports.ArgumentError = ArgumentError

/**
 * Properties:
 *
 * config: The config file to use. The default is inferred from
 *         `${args.files[0]}/.tl.${ext}`, taking the first `ext` from
 *         `--require` or whatever's inferred from node-interpret.
 *
 * cwd: This changes the default current working directory. It normally defaults
 *      to `process.cwd()` or whatever was passed for `--cwd`, but the unit
 *      tests may change that default.
 *
 * require: A list of extensions + possible modules to require/register. This
 *          effectively disables much of the inferrence magic based on `cwd`,
 *          the first `files` glob, and `config` to come up with something
 *          sensible.
 *
 * files: A list of file globs to load.
 *
 * help: If set to `"simple"` or `"detailed"`, display the help prompt.
 */
class Args {
    constructor(opts) {
        this.config = opts.config != null ? opts.config : null
        this.cwd = opts.cwd != null ? opts.cwd : null
        this.require = opts.require != null ? opts.require : []
        this.files = opts.files != null ? opts.files : []
        this.help = opts.help != null ? opts.help : null
    }
}
exports.Args = Args

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
const requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "require": true,
}

const aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "require",
}

function *serializeRest(boolean, argv, i) {
    if (!boolean) {
        throw new ArgumentError(m("missing.cli.shorthand", argv[i - 2]))
    }

    while (i < argv.length) {
        yield {type: "file", value: argv[i++], boolean: true}
    }
}

/**
 * Serializes `argv` into a list of tokens.
 */
function *serialize(argv) {
    let boolean = true

    for (const pair of argv.entries()) {
        const entry = pair[1]

        if (entry === "--") {
            yield* serializeRest(boolean, argv, pair[0] + 1)
            break
        }

        if (!boolean || entry[0] !== "-") {
            // Allow anything other than literally `--` as a value. If it's a
            // mistake, this'll likely complain later, anyways.
            yield {type: "value", value: entry, boolean}
            boolean = true
            continue
        }

        if (entry[1] === "-") {
            const value = entry.slice(2)

            boolean = !requiresValue[value]
            yield {type: "flag", value, boolean}
            continue
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
                const value = aliases[short]

                boolean = !requiresValue[value]
                yield {type: "flag", value, boolean}
            }

            last = short
        }
    }
}

function setFlag(args, arg) {
    if (arg.value === "help") {
        args.help = "simple"
    } else if (arg.value === "help-detailed") {
        args.help = "detailed"
    } else {
        return arg
    }

    return null
}

function parseSingle(last, args, arg) {
    if (arg.type === "flag") {
        return setFlag(args, arg)
    }

    if (last == null || arg.type === "file") {
        args.files.push(arg.value)
        return null
    }

    // Silently ignore invalid arguments
    const current = args[last.value]

    if (Array.isArray(current)) {
        current.push(arg.value)
    } else if (!last.boolean) {
        args[last.value] = arg.value
    } else {
        args[last.value] = true

        if (arg.type === "flag") {
            return setFlag(args, arg)
        }

        args.files.push(arg.value)
    }

    return null
}

exports.parse = (cwd, argv) => {
    const args = new Args({cwd})
    let last

    for (const arg of serialize(argv)) {
        last = parseSingle(last, args, arg)
    }

    if (last != null && !last.boolean) {
        throw new ArgumentError(m("missing.cli.argument", last.value))
    }

    return args
}
