"use strict"

var assert = require("../util").assert
var hasOwn = Object.prototype.hasOwnProperty

// TODO: Duplicate this in the `tl` binary to just preparse for known/unknown
// options when starting up initially, so it's more future-proof

// Errors that aren't from this borking up. It intentionally doesn't have a
// stack trace.
function warn(message) {
    assert(typeof message === "string")
    return {message: "Warning: " + message}
}

/**
 * Properties:
 *
 * color: If not `null`, force the color on if `true`, off if `false`.
 *
 * config: The config file to use. The default is inferred from
 *         `${args.files[0]}/.tl.${ext}`, taking the first `ext` from
 *         `--require` or whatever's inferred from node-interpret.
 *
 * cwd: This changes the default current working directory. It normally defaults
 *      to `process.cwd()` or whatever was passed for `--cwd`, but the unit
 *      tests may change that default.
 *
 * env: This is a key-value mapping for the environment Node is to be respawned
 *      with.
 *
 * files: A list of file globs to load.
 *
 * help: If set to `"simple"` or `"detailed"`, display the relevant help prompt.
 *
 * opts: The `.tl.opts` file as used in the init script.
 *
 * require: A list of extensions + possible modules to require/register. This
 *          effectively disables much of the inferrence magic based on `cwd`,
 *          the first `files` glob, and `config` to come up with something
 *          sensible.
 *
 * respawnAs: If set, it's the binary to respawn with. Setting this also implies
 *            setting `respawn` to `true` ignorant of other options.
 *
 * unknown: This contains all unknown flags, so they can be passed to Node
 *          transparently (unless `respawn === false`).
 */
exports.Args = Args
function Args() {
    this.color = undefined
    this.config = undefined
    this.cwd = undefined
    this.env = undefined
    this.files = []
    this.help = undefined
    this.opts = undefined
    this.require = []
    this.respawnAs = undefined
    this.unknown = []
}

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
var requiresValue = {
    "config": true,
    "cwd": true,
    "env": true,
    "opts": true,
    "require": true,
    "respawn-as": true,
}

var aliases = {
    c: "config",
    e: "env",
    H: "help-detailed",
    h: "help",
    r: "require",
}

/**
 * Serializes `args` into a list of tokens.
 */
function serialize(args, call) { // eslint-disable-line max-statements
    assert(Array.isArray(args))
    assert(typeof call === "function")

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
                    throw warn(
                        "Shorthand option -" + last + " requires a value " +
                        "immediately after it")
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
        throw warn(
            "Shorthand option -" + args[i - 1] + " requires a value " +
            "immediately after it")
    }

    // The above loop only breaks early with an `--` argument, and this loop's
    // preincrement in its condition handles this as well.
    while (++i < args.length) {
        call("file", args[i], true)
    }
}

exports.parse = function (args) {
    assert(Array.isArray(args))

    var result = new Args()
    var lastBoolean = false
    var lastValue

    serialize(args, function (type, value, boolean) {
        assert(typeof type === "string")
        assert(typeof value === "string")
        assert(typeof boolean === "boolean")

        if (type === "flag") {
            switch (value) {
            case "help": result.help = "simple"; break
            case "help-detailed": result.help = "detailed"; break
            case "color": result.color = true; break
            case "no-color": result.color = false; break

            case "config": case "cwd": case "env":
            case "opts": case "require": case "respawn-as":
                lastValue = value
                lastBoolean = boolean
                return

            // Legacy options - ignore them, and remove in 0.5.
            case "force-local": case "no-force-local":
            case "respawn": case "no-respawn":
                break

            default:
                result.unknown.push("--" + value)
            }
        } else if (lastValue == null || type === "file") {
            result.files.push(value)
        } else if (lastValue === "env") {
            var index = value.indexOf("=")

            if (result.env == null) result.env = Object.create(null)
            result.env[value.slice(0, index)] = value.slice(index + 1)
        } else {
            if (lastValue === "respawn-as") {
                lastValue = "respawnAs"
            }

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
        throw warn(
            "Option was passed without a required argument: " + lastValue)
    }

    return result
}
