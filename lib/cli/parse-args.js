"use strict"

var path = require("path")
var globParent = require("glob-parent")

var m = require("../messages.js")
var methods = require("../util/methods.js")
var ArgumentError = require("./argument-error.js")
var serialize = require("./args/serialize.js")

var hasOwn = {}.hasOwnProperty

module.exports = function (cwd, argv) {
    return new Parser(cwd, argv).parse()
}

// Not all arguments need to know if they're set, but this is for consistency
function makeArg(value) {
    return {set: false, value: value}
}

function Parser(cwd, argv) {
    this.argv = serialize(argv)

    this.args = {
        // These are resolved later.
        config: makeArg(null),
        module: makeArg(null),

        cwd: makeArg(cwd),
        register: makeArg([]),
        files: makeArg([]),
        reporter: makeArg([]),

        // This has three possible values:
        //
        // `null` - normal
        // `"simple"` - simple help
        // `"detailed"` - detailed help
        help: null,
    }
}

var sentinel = {type: "sentinel", value: null, boolean: true}

var types = {
    flag: function (args, arg) {
        // These exit early
        if (arg.value === "help") {
            args.help = "simple"
        } else if (arg.value === "help-detailed") {
            args.help = "detailed"
        } else {
            return arg
        }
        return sentinel
    },

    value: function (args, arg, last) {
        if (last !== sentinel) {
            // Silently ignore invalid arguments
            if (hasOwn.call(args, last.value)) {
                if (Array.isArray(args[last.value].value)) {
                    args[last.value].value.push(arg.value)
                } else if (last.boolean) {
                    args[last.value].value = true
                } else {
                    args[last.value].value = arg.value
                }

                args[last.value].set = true
            }
        } else {
            args.files.value.push(arg.value)
        }

        return sentinel
    },

    file: function (args, arg) {
        args.files.value.push(arg.value)
        return sentinel
    },
}

methods(Parser, {
    setTentativeDefaults: function () {
        if (this.args.files.value.length === 0) {
            this.args.files.value = [path.join("test", "**")]
        } else {
            this.args.files.set = true
        }

        if (!this.args.config.set) {
            // Take the first item to infer the file from.
            this.args.config.value = path.join(
                globParent(this.args.files.value[0]),
                ".techtonic")
        }
    },

    setFromList: function () {
        var args = this.args

        var last = this.argv.reduce(function (last, arg) {
            return types[arg.type](args, arg, last)
        }, sentinel)

        if (!last.boolean) {
            throw new ArgumentError(m("missing.cli.argument", last.value))
        }
    },

    parse: function () {
        this.setFromList()
        this.setTentativeDefaults()

        return this.args
    },
})
