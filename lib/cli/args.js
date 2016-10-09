"use strict"

var hasOwn = Object.prototype.hasOwnProperty

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
    this.config = opts.config != null ? opts.config : undefined
    this.cwd = opts.cwd != null ? opts.cwd : undefined
    this.require = opts.require != null ? opts.require : []
    this.files = opts.files != null ? opts.files : []
    this.help = opts.help != null ? opts.help : undefined
    this.color = opts.color != null ? opts.color : undefined
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

/**
 * Serializes `argv` into a list of tokens.
 */
function serialize(argv, call) {
    var boolean = true
    var i = 0

    while (i < argv.length && argv[i] !== "--") {
        var entry = argv[i++]

        if (!boolean || entry[0] !== "-") {
            // Allow anything other than literally `--` as a value. If it's a
            // mistake, this'll likely complain later, anyways.
            call("value", entry, boolean)
            boolean = true
        } else if (entry[1] === "-") {
            var value = entry.slice(2)

            boolean = !requiresValue[value]
            call("flag", value, boolean)
        } else {
            var last

            for (var j = 1; j < entry.length; j++) {
                var short = entry[j]

                // If we're not yet done parsing the shorthand alias, then the
                // current binary option *clearly* won't have a value to use.
                if (!boolean) {
                    throw new Error("Shorthand option -" + last +
                        " requires a value immediately after it")
                }

                // Silently ignore invalid flags.
                if (hasOwn.call(aliases, short)) {
                    var alias = aliases[short]

                    boolean = !requiresValue[alias]
                    call("flag", alias, boolean)
                }

                last = short
            }
        }
    }

    if (!boolean) {
        throw new Error("Shorthand option -" + argv[i - 1] +
            " requires a value immediately after it")
    }

    // The above loop only breaks early with an `--` argument, and this loop's
    // preincrement in its condition handles this as well.
    while (++i < argv.length) {
        call("file", argv[i], true)
    }
}

exports.parse = function (cwd, argv) {
    var args = new Args({cwd: cwd})
    var lastBoolean = false
    var lastValue

    serialize(argv, function (type, value, boolean) {
        if (type === "flag") {
            switch (value) {
            case "help": args.help = "simple"; break
            case "help-detailed": args.help = "detailed"; break
            case "color": args.color = true; break
            case "no-color": args.color = false; break
            default:
                lastValue = value
                lastBoolean = boolean
                return
            }
        } else if (lastValue == null || type === "file") {
            args.files.push(value)
        } else {
            // Silently ignore invalid arguments
            var current = args[lastValue]

            if (Array.isArray(current)) {
                current.push(value)
            } else if (lastBoolean) {
                args[lastValue] = true
                args.files.push(value)
            } else {
                args[lastValue] = value
            }
        }

        lastValue = null
    })

    if (lastValue != null && !lastBoolean) {
        throw new Error(
            "Option was passed without a required argument: " + lastValue)
    }

    return args
}
