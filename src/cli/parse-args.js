import * as path from "path"

import m from "../messages.js"
import ArgumentError from "./argument-error.js"
import serialize from "./args/serialize.js"

const hasOwn = {}.hasOwnProperty

export function parseArgs(cwd, argv) {
    return new Parser(cwd, argv).parse()
}

// Not all arguments need to know if they're set, but this is for consistency
function makeArg(value) {
    return {set: false, value}
}

function initArgs(cwd) {
    return {
        /**
         * The config file to use. The default is inferred from
         * `${args.files[0]}/.techtonic.${ext}` after merging the JSON options,
         * taking the first `ext` from `--register` or whatever's inferred from
         * node-interpret.
         */
        config: makeArg(null),

        /**
         * The module to represent Techtonic with, in case `--reporter` is
         * passed and the config file does *not* return an instance. This is
         * overridden by the config file.
         */
        module: makeArg("techtonic"),

        /**
         * This changes the default current working directory. It defaults to
         * the initial `process.cwd()`, although the unit tests do use internal
         * hooks to change that default.
         */
        cwd: makeArg(cwd),

        /**
         * A list of extensions + possible modules to register. This effectively
         * disables much of the inferrence magic based on `cwd`, the first
         * `files` glob, and `config` to come up with something sensible.
         */
        register: makeArg([]),

        /**
         * A list of all files. If none are passed, this defaults to a single
         * entry of `test/**`.
         */
        files: makeArg([]),

        /**
         * A list of reporters to add after running the config.
         */
        reporters: makeArg([]),

        /**
         * If set to `"simple"` or `"detailed"`, display the help prompt.
         * Otherwise, this is ignored.
         */
        help: null,
    }
}

const sentinel = {type: "sentinel", value: null, boolean: true}

function coerceSubarg(last, arg) {
    if (last.value === "reporters" && typeof arg.value === "string") {
        arg.value = {module: arg.value, args: []}
    }
}

const types = {
    flag(args, arg) {
        if (arg.value === "help") {
            args.help = "simple"
            return sentinel
        } else if (arg.value === "help-detailed") {
            args.help = "detailed"
            return sentinel
        } else {
            // The parsed object uses a plural name, while the CLI argument uses
            // a singular name.
            if (arg.value === "reporter") {
                arg.value = "reporters"
            }

            return arg
        }
    },

    value(args, arg, last) {
        if (last !== sentinel) {
            // Silently ignore invalid arguments
            if (hasOwn.call(args, last.value)) {
                if (Array.isArray(args[last.value].value)) {
                    coerceSubarg(last, arg)
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

    file(args, arg) {
        args.files.value.push(arg.value)
        return sentinel
    },
}

class Parser {
    constructor(cwd, argv) {
        this.argv = serialize(argv)
        this.args = initArgs(cwd)
    }

    setFromList() {
        const last = this.argv.reduce(
            (last, arg) => types[arg.type](this.args, arg, last),
            sentinel)

        if (!last.boolean) {
            throw new ArgumentError(m("missing.cli.argument", last.value))
        }
    }

    setKnownDefaults() {
        if (this.args.files.value.length === 0) {
            this.args.files.value = [path.join("test", "**")]
        } else {
            this.args.files.set = true
        }
    }

    parse() {
        this.setFromList()
        this.setKnownDefaults()

        return this.args
    }
}
