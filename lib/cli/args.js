"use strict"

var Errors = require("../errors.js")
var m = require("../messages.js")

var hasOwn = Object.prototype.hasOwnProperty

var ArgumentError = exports.ArgumentError = Errors.defineError([
    "class ArgumentError extends Error {",
    "    get name() {",
    "        return 'ArgumentError'",
    "    }",
    "}",
    "new ArgumentError('message')", // check native subclassing support
    "return AssertionError",
], {
    constructor: function (message) {
        Errors.readStack(this)
        this.message = message
    },

    name: "ArgumentError",
})

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
 * color: If not `null`, force the color on if `true`, off if `false`.
 *
 * help: If set to `"simple"` or `"detailed"`, display the help prompt.
 */
exports.Args = Args
function Args(opts) {
    this.config = opts.config != null ? opts.config : null
    this.cwd = opts.cwd != null ? opts.cwd : null
    this.require = opts.require != null ? opts.require : []
    this.files = opts.files != null ? opts.files : []
    this.help = opts.help != null ? opts.help : null
    this.color = opts.color != null ? opts.color : null
}

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
var requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "require": true,

    // Used by supports-color
    "color": false,
    "no-color": false,
}

var aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "require",
}

function serializeRest(boolean, argv, i, call) {
    if (!boolean) {
        throw new ArgumentError(m("missing.cli.shorthand", argv[i - 2]))
    }

    while (i < argv.length) {
        call({type: "file", value: argv[i++], boolean: true})
    }
}

/**
 * Serializes `argv` into a list of tokens.
 */
function serialize(argv, call) {
    var boolean = true

    for (var i = 0; i < argv.length; i++) {
        var entry = argv[i]

        if (entry === "--") {
            serializeRest(boolean, argv, i + 1, call)
            break
        }

        if (!boolean || entry[0] !== "-") {
            // Allow anything other than literally `--` as a value. If it's a
            // mistake, this'll likely complain later, anyways.
            call({type: "value", value: entry, boolean: boolean})
            boolean = true
            continue
        }

        if (entry[1] === "-") {
            var value = entry.slice(2)

            boolean = !requiresValue[value]
            call({type: "flag", value: value, boolean: boolean})
            continue
        }

        var last

        for (var j = 1; j < entry.length; j++) {
            var short = entry[j]

            // If we're not yet done parsing the shorthand alias, then the
            // current binary option *clearly* won't have a value to use.
            if (!boolean) {
                throw new ArgumentError(m("missing.cli.shorthand", last))
            }

            // Silently ignore invalid flags.
            if (hasOwn.call(aliases, short)) {
                var alias = aliases[short]

                boolean = !requiresValue[alias]
                call({type: "flag", value: alias, boolean: boolean})
            }

            last = short
        }
    }
}

function setFlag(args, arg) {
    switch (arg.value) {
    case "help": args.help = "simple"; break
    case "help-detailed": args.help = "detailed"; break
    case "color": args.color = true; break
    case "no-color": args.color = false; break
    default: return arg
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
    var current = args[last.value]

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

exports.parse = function (cwd, argv) {
    var args = new Args({cwd: cwd})
    var last

    serialize(argv, function (arg) {
        last = parseSingle(last, args, arg)
    })

    if (last != null && !last.boolean) {
        throw new ArgumentError(m("missing.cli.argument", last.value))
    }

    return args
}
