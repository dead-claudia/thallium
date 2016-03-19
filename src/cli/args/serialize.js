import subarg from "./subarg.js"
import ArgumentError from "../argument-error.js"
import m from "../../messages.js"

const hasOwn = Object.prototype.hasOwnProperty

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
const requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "module": true,
    "register": true,
    "reporter": true,
}

const aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "register",
    m: "module",
    R: "reporter",
}

/**
 * Serializes `argv` into a list of tokens, with subargs resolved.
 */
export default function (argv) {
    return new Serializer(argv).serialize()
}

// Reduces bookkeeping when dealing with the serialized version.
export function isBoolean(item) {
    return !requiresValue[item]
}

class Serializer {
    constructor(argv) {
        this.argv = argv
        this.args = []
        this.valueRequired = false
        this.acceptsArgs = false
    }

    push(type, value) {
        this.args.push({type, value, boolean: !this.valueRequired})
    }

    pushFlag(arg) {
        this.valueRequired = !!requiresValue[arg]
        this.acceptsArgs = arg === "reporter"
        this.push("flag", arg)
    }

    serializeShorthand(entry) {
        if (this.valueRequired) {
            throw new Error("No value should be required yet")
        }

        let last

        for (const short of entry.slice(1)) {
            // If we're not yet done parsing the shorthand alias, then the
            // current binary option *clearly* won't have a value to use.
            if (this.valueRequired) {
                throw new ArgumentError(m("missing.cli.shorthand.value", last))
            }

            // Silently ignore invalid flags.
            if (hasOwn.call(aliases, short)) {
                this.pushFlag(aliases[short])
            }

            last = short
        }
    }

    serializeRest(i) {
        if (this.valueRequired) {
            throw new ArgumentError(
                m("missing.cli.shorthand.value", this.argv[i - 2]))
        }

        while (i < this.argv.length) {
            this.push("file", this.argv[i++])
        }
    }

    serializeSubarg(i) {
        if (!this.acceptsArgs) {
            throw new ArgumentError(m("only.cli.reporter.syntax"))
        }

        const result = subarg(this.argv, i + 1)

        this.push("value", result.value)
        return result.index
    }

    serializeValue(value) {
        this.push("value", value)
        this.valueRequired = false
    }

    serialize() {
        for (let i = 0; i < this.argv.length; i++) {
            const entry = this.argv[i]

            if (entry === "--") {
                this.serializeRest(i + 1)
                break
            }

            // Check for argument syntax.
            if (entry === "[") {
                i = this.serializeSubarg(i)
                continue
            }

            // Allow anything other than `--` or `[` in the value position. If
            // it's a mistake, this'll likely complain later, anyways.
            if (this.valueRequired || entry[0] !== "-") {
                this.serializeValue(entry)
                continue
            }

            if (entry[1] !== "-") {
                this.serializeShorthand(entry)
                continue
            }

            this.pushFlag(entry.slice(2))
        }

        return this.args
    }
}
