"use strict"

var path = require("path")
var m = require("../messages.js")
var ArgumentError = require("./argument-error.js")

var hasOwn = Object.prototype.hasOwnProperty

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
var requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "register": true,
}

var aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "register",
}

function argToken(type, value, boolean) {
    return {type: type, value: value, boolean: boolean}
}

/**
 * Serializes `argv` into a list of tokens.
 */
function serialize(argv) {
    var args = []
    var boolean = true

    function push(type, value) {
        args.push(argToken(type, value, boolean))
    }

    function pushFlag(value) {
        boolean = !requiresValue[value]
        push("flag", value)
    }

    function shorthand(entry) {
        if (!boolean) {
            throw new Error("No value should be required yet")
        }

        // This is a string
        entry = entry.slice(1)

        for (var i = 0, last; i < entry.length; i++) {
            // If we're not yet done parsing the shorthand alias, then the
            // current binary option *clearly* won't have a value to use.
            if (!boolean) {
                throw new ArgumentError(m("missing.cli.shorthand", last))
            }

            var short = entry[i]

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

    for (var i = 0; i < argv.length; i++) {
        var entry = argv[i]

        if (entry === "--") {
            rest(i + 1)
            break
        }

        // Allow anything other than `--` or in the value position. If it's a
        // mistake, this'll likely complain later, anyways.
        if (!boolean || entry[0] !== "-") {
            value(entry)
        } else if (entry[1] !== "-") {
            shorthand(entry)
        } else {
            pushFlag(entry.slice(2))
        }
    }

    return args
}

var Arg = {
    create: function (value) {
        return {passed: false, value: value}
    },

    set: function (arg, value) {
        arg.passed = true
        arg.value = value
    },

    push: function (arg, value) {
        arg.passed = true
        arg.value.push(value)
    },
}

/**
 * Properties:
 *
 * config: The config file to use. The default is inferred from
 *         `${args.files[0]}/.techtonic.${ext}`, taking the first `ext` from
 *         `--register` or whatever's inferred from node-interpret.
 *
 * cwd: This changes the default current working directory. It defaults to the
 *      initial `process.cwd!`, although the unit tests do use internal hooks
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
        config: Arg.create(null),
        cwd: Arg.create(cwd),
        register: Arg.create([]),
        files: Arg.create([]),
        help: Arg.create(null),
    }
}

function dispatch(args, arg, last) {
    switch (arg.type) {
    case "flag":
        if (arg.value === "help") {
            Arg.set(args.help, "simple")
        } else if (arg.value === "help-detailed") {
            Arg.set(args.help, "detailed")
        } else {
            return arg
        }
        break

    case "value":
        if (last == null) {
            Arg.push(args.files, arg.value)
            break
        }

        // Silently ignore invalid arguments
        if (!hasOwn.call(args, last.value)) break

        var current = args[last.value]

        if (Array.isArray(current.value)) {
            Arg.push(current, arg.value)
        } else {
            Arg.set(current, last.boolean || arg.value)
        }

        break

    case "file":
        Arg.push(args.files, arg.value)
        break

    default: throw new Error("unreachable (unknown type " + arg.type + ")")
    }

    return null
}

module.exports = function (cwd, argv) {
    var args = initArgs(cwd)
    var serialized = serialize(argv)
    var last

    for (var i = 0; i < serialized.length; i++) {
        last = dispatch(args, serialized[i], last)
    }

    if (last != null && !last.boolean) {
        throw new ArgumentError(m("missing.cli.argument", last.value))
    }

    if (args.files.value.length === 0) {
        args.files.value = [path.join("test", "**")]
    }

    return args
}
