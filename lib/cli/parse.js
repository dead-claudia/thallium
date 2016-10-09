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
function Args() {
    this.color = undefined
    this.config = undefined
    this.cwd = undefined
    this.files = []
    this.forceLocal = false
    this.help = undefined
    this.require = []
    this.respawn = true
    this.unknown = []
}

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
var requiresValue = {
    "color": false,
    "config": true,
    "cwd": true,
    "force-local": false,
    "help-detailed": false,
    "help": false,
    "no-color": false,
    "no-force-local": false,
    "no-respawn": false,
    "require": true,
    "respawn": false,
}

var aliases = {
    c: "config",
    H: "help-detailed",
    h: "help",
    r: "require",
}

/**
 * Serializes `args` into a list of tokens.
 */
function serialize(args, call) {
    var boolean = true
    var i = 0

    while (i < args.length && args[i] !== "--") {
        var entry = args[i++]

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

                // Silently ignore invalid short flags - V8 doesn't use any.
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
        throw new Error("Shorthand option -" + args[i - 1] +
            " requires a value immediately after it")
    }

    // The above loop only breaks early with an `--` argument, and this loop's
    // preincrement in its condition handles this as well.
    while (++i < args.length) {
        call("file", args[i], true)
    }
}

module.exports = function (args) {
    var result = new Args()
    var lastBoolean = false
    var lastValue

    serialize(args, function (type, value, boolean) {
        if (type === "flag") {
            switch (value) {
            case "help": result.help = "simple"; break
            case "help-detailed": result.help = "detailed"; break
            case "color": result.color = true; break
            case "no-color": result.color = false; break
            case "respawn": result.respawn = true; break
            case "no-respawn": result.respawn = false; break
            case "force-local": result.forceLocal = true; break
            case "no-force-local": result.forceLocal = false; break

            case "config": case "cwd": case "require":
                lastValue = value
                lastBoolean = boolean
                return

            default:
                result.unknown.push(value)
            }
        } else if (lastValue == null || type === "file") {
            result.files.push(value)
        } else {
            // Silently ignore invalid arguments
            var current = result[lastValue]

            if (Array.isArray(current)) {
                current.push(value)
            } else if (lastBoolean) {
                result[lastValue] = true
                result.files.push(value)
            } else {
                result[lastValue] = value
            }
        }

        lastValue = null
    })

    if (lastValue != null && !lastBoolean) {
        throw new Error(
            "Option was passed without a required argument: " + lastValue)
    }

    return result
}
