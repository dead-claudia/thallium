"use strict"

var path = require("path")
var globParent = require("glob-parent")

var help = require("./help.js")
var methods = require("../util/methods.js")
var errors = require("./errors.js")

module.exports = function (argv) {
    return new ArgParser(argv).parse()
}

// Not all arguments need to know if they're set, but this is for consistency
function set(value) {
    return {set: false, value: value}
}

function ArgParser(argv) {
    this.argv = argv

    this.args = {
        // These are resolved later.
        config: set(null),
        module: set(null),

        cwd: set(this.oldCwd),
        register: set([]),
        files: set([]),
    }
}

methods(ArgParser, {
    setTentativeDefaults: function () {
        var args = this.args
        if (args.files.length === 0) {
            args.files.value = [path.join(".", "test", "**")]
        } else {
            args.files.set = true
        }

        if (!args.config.set) {
            // Take the first item to infer the file from.
            args.config.value = path.join(
                globParent(args.files.value[0]),
                ".techtonic")
        }
    },

    parseSingle: function (last, arg, i) {
        if (last != null) {
            if (Array.isArray(this.args[last])) {
                this.args[last].value.push(arg)
            } else {
                this.args[last].value = arg
            }

            this.args[last].set = true
            return null
        }

        if (arg === "--") {
            throw new errors.Bail(i + 1)
        }

        // These exit early
        if (/^(-h|--help)$/.test(arg)) {
            help()
            throw new errors.Exit()
        }

        if (/^(-hh|--help-detailed)$/.test(arg)) {
            help(true)
            throw new errors.Exit()
        }

        if (/^(-c|--config)$/.test(arg)) return "config"
        if (/^(-m|--module)$/.test(arg)) return "module"
        if (/^(-r|--register)$/.test(arg)) return "register"
        if (arg === "--cwd") return "cwd"

        if (!/^-/.test(arg)) {
            this.args.files.value.push(arg)
        }

        return null
    },

    parse: function () {
        var i = this.argv.length
        var last

        try {
            last = this.argv.reduce(this.parseSingle, null, this)
        } catch (e) {
            if (e instanceof errors.Bail) {
                i = e.index
            } else {
                throw e
            }
        }

        if (last != null) {
            var message = "Option was passed without a required argument: "
            message += this.argv[this.length - 1]
            throw new errors.Exit(new Error(message))
        }

        // Append the rest of the arguments as files.
        while (i < this.argv.length) this.args.files.value.push(this.argv[i++])

        this.setTentativeDefaults()

        return this.args
    },
})
