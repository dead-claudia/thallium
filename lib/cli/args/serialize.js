"use strict"

var methods = require("../../util/methods.js")
var subarg = require("./subarg.js")
var ArgumentError = require("../argument-error.js")
var m = require("../../messages.js")

var hasOwn = {}.hasOwnProperty

// `true` means it requires a value. If the key doesn't exist, the flag is
// implicitly false, since this table is checked for truthiness, not actual
// existence + true/false.
var requiresValue = {
    "config": true,
    "cwd": true,
    "help-detailed": false,
    "help": false,
    "module": true,
    "register": true,
    "reporter": true,
}

var aliases = {
    h: "help",
    H: "help-detailed",
    c: "config",
    r: "register",
    m: "module",
    R: "reporter",
}

module.exports = function (argv) {
    return new Serializer(argv).serialize()
}

// Reduces bookkeeping when dealing with the serialized version.
module.exports.isBoolean = function (item) {
    return !requiresValue[item]
}

function Serializer(argv) {
    this.argv = argv
    this.args = []
    this.valueRequired = false
    this.acceptsArgs = false
}

methods(Serializer, {
    push: function (type, value) {
        this.args.push({
            type: type,
            value: value,
            boolean: !this.valueRequired,
        })
    },

    pushFlag: function (arg) {
        this.valueRequired = !!requiresValue[arg]
        this.acceptsArgs = arg === "reporter"
        this.push("flag", arg)
    },

    serializeShorthand: function (entry) {
        if (this.valueRequired) {
            throw new Error("No value should be required yet")
        }

        var last

        for (var i = 1; i < entry.length; i++) {
            var short = entry[i]

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
    },

    serializeRest: function (i) {
        if (this.valueRequired) {
            throw new ArgumentError(
                m("missing.cli.shorthand.value", this.argv[i - 2]))
        }

        while (i < this.argv.length) {
            this.push("file", this.argv[i++])
        }
    },

    serializeSubarg: function (i) {
        if (!this.acceptsArgs) {
            throw new ArgumentError(m("only.cli.reporter.syntax"))
        }

        var result = subarg(this.argv, i + 1)

        this.push("value", result.value)
        return result.index
    },

    serializeValue: function (value) {
        this.push("value", value)
        this.valueRequired = false
    },

    serialize: function () {
        for (var i = 0; i < this.argv.length; i++) {
            var entry = this.argv[i]

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
    },
})
