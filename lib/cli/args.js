"use strict"

// Keep this zero-dependency, since it's loaded by `cli.js` *before* replacing
// the runtime.

// Errors that aren't from this borking up. It intentionally doesn't have a
// stack trace.
function warn(option) {
    return "Warning: Option was passed without a required argument: " + option
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

/**
 * Parses a flag, optionally returning the flag if it's non-boolean
 */
function parseFlag(result, flag) {
    switch (flag) {
    case "--help": result.help = "simple"; return undefined
    case "--help-detailed": result.help = "detailed"; return undefined
    case "--color": result.color = true; return undefined
    case "--no-color": result.color = false; return undefined

    case "--respawn-as": case "--config": case "--cwd": case "--env":
    case "--opts": case "--require":
        return flag

    // Legacy options - ignore them, and remove in 0.5.
    case "--force-local": case "--no-force-local":
    case "--respawn": case "--no-respawn":
        return undefined

    // Silently ignore invalid arguments
    default:
        result.unknown.push(flag)
        return undefined
    }
}

function parseValue(result, value, flag) {
    switch (flag) {
    case "--env":
        var index = value.indexOf("=")

        if (result.env == null) result.env = Object.create(null)
        result.env[value.slice(0, index)] = value.slice(index + 1)
        break

    case "--respawn-as": result.respawnAs = value; break
    case "--config": result.config = value; break
    case "--cwd": result.cwd = value; break
    case "--opts": result.opts = value; break
    case "--require": result.require.push(value); break
    default: throw new TypeError("unreachable: " + flag)
    }
}

exports.parse = function (args) {
    if (!Array.isArray(args)) {
        throw new Error("args must be an array!")
    }

    var result = new Args()
    var i = 0
    var lastFlag, lastOption

    while (i < args.length && args[i] !== "--") {
        var entry = args[i++]

        if (lastFlag != null) {
            // Allow anything other than literally `--` as a value. If it's a
            // mistake, this'll likely complain later, anyways.
            parseValue(result, entry, lastFlag)
            lastOption = undefined
            lastFlag = undefined
        } else if (entry[0] !== "-") {
            result.files.push(entry)
        } else if (entry[1] === "-") {
            lastFlag = parseFlag(result, entry)
        } else {
            for (var j = 1; j < entry.length; j++) {
                // If we're not yet done parsing the shorthand alias, then the
                // current binary option *clearly* won't have a value to use.
                if (lastFlag != null) throw warn(lastOption)
                switch (entry[j]) {
                case "H": lastOption = "-H"; result.help = "detailed"; break
                case "h": lastOption = "-h"; result.help = "simple"; break
                case "c": lastOption = "-c"; lastFlag = "--config"; break
                case "e": lastOption = "-e"; lastFlag = "--env"; break
                case "r": lastOption = "-r"; lastFlag = "--require"; break
                // Silently ignore invalid short flags - V8 doesn't use any.
                default:
                }
            }
        }
    }

    if (lastFlag != null) throw warn(lastOption)

    // The above loop only breaks early with an `--` argument, and this loop's
    // preincrement in its condition handles this as well.
    while (++i < args.length) result.files.push(args[i])

    return result
}
