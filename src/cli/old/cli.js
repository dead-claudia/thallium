import * as path from "path"
import * as resolve from "resolve"
import * as gs from "glob-stream"

import help from "../help.js"
import parseArgs from "../parse-args.js"
import ArgumentError from "../argument-error.js"
import readConfig from "./config.js"
import {isThenable} from "../../util/util.js"

export default function (cwd, argv, next) {
    return new CliEngine(cwd, argv, next).run()
}

function fixExtension(config, files) {
    if (!files.set) {
        const ext = config != null ? path.extname(config) : ".js"

        // Don't resolve this yet.
        files.value = [path.join(".", "test", "**", `*${ext}`)]
    }
}

function loadRequires(cwd, requires) {
    const opts = {basedir: cwd}
    const techtonic = resolve.sync("techtonic", opts)

    /* eslint-disable global-require */

    requires.forEach(req => {
        req.register(require(resolve.sync(req.module, opts)))
    })

    /* eslint-enable global-require */

    return techtonic
}

class CliEngine {
    constructor(cwd, argv, callback) {
        this.oldCwd = cwd

        try {
            this.args = parseArgs(cwd, argv)
            this.error = null

            if (this.args.help) {
                help(this.args.help === "detailed")
                this.args = null
            }
        } catch (e) {
            if (e instanceof ArgumentError) {
                this.args = null
                this.error = e.error
            } else {
                throw e
            }
        }

        this.callback = callback
        this.data = null
    }

    finish(err) {
        const {callback} = this

        this.callback = null
        process.chdir(this.oldCwd)
        return process.nextTick(() => callback(err))
    }

    makeNext(next) {
        let called = false

        return (err, data) => {
            if (called) return
            called = true
            if (err != null) {
                process.nextTick(() => this.finish(err))
            } else {
                process.nextTick(() => next(data))
            }
        }
    }

    resolveCallback(func, inst, default_, next) {
        if (typeof func !== "function") {
            return process.nextTick(() => next(default_))
        }

        const callback = this.makeNext(next)

        try {
            const res = func.call(inst, callback)

            if (isThenable(res)) {
                res.then(value => callback(null, value), e => callback(e))
            }

            return undefined
        } catch (e) {
            return process.nextTick(() => callback(e))
        }
    }

    callHook(name) {
        return (result, next) =>
            this.resolveCallback(result[name], result, undefined, next)
    }

    requireConfig(next) {
        const config = this.data.config
        let result

        if (config != null) {
            try {
                result = require(config) // eslint-disable-line global-require
            } catch (e) {
                return this.finish(e)
            }
        }

        return this.resolveCallback(result, undefined, result, next)
    }

    // The null checks do parse out the defaults.
    opt(result, name, def) {
        if (result != null && !this.args[name].set && result[name] != null) {
            return result[name]
        } else {
            return def()
        }
    }

    parseResult(techtonic, result) {
        return {
            result: result != null ? result : {},

            files: this.opt(result, "files", () => this.args.files.value),
            t: this.opt(result, "techtonic", () => {
                const mod = this.opt(result, "module", () => techtonic)

                return require(mod) // eslint-disable-line global-require
            }),
        }
    }

    // Impure fixed-point combinator to clean up a *lot* of repetition.
    iterate(init, funcs) {
        const loop = (result, i) => {
            if (i === funcs.length) return this.finish()

            try {
                // Don't kill the stack
                return funcs[i](result, result =>
                    process.nextTick(() => loop(result, i + 1)))
            } catch (e) {
                return this.finish(e)
            }
        }

        return loop(init, 0)
    }

    run() {
        if (this.args == null) {
            return this.finish(this.error)
        }

        let techtonic

        try {
            // This is a no-op if --cwd was not passed/is already the current
            // working directory.
            process.chdir(this.args.cwd.value)

            this.data = readConfig(this.args.config, this.args.register)
            fixExtension(this.data.config, this.args.files)

            techtonic = loadRequires(this.args.cwd.value, this.data.requires)
        } catch (e) {
            return this.finish(e)
        }

        return this.requireConfig(result => {
            return this.iterate(this.parseResult(techtonic, result), [
                this.callHook("oninit"),

                (result, next) => {
                    const callback = this.makeNext(next)

                    gs.createStream(result.files, {allowEmpty: true})
                    .on("error", callback)
                    .on("data", data => {
                        // This will never be equal if `this.data.config` is
                        // `null`.
                        /* eslint-disable global-require */

                        if (data !== this.data.config) require(data)

                        /* eslint-enable global-require */
                    })
                    .on("end", callback)
                },

                this.callHook("onload"),

                (result, next) => result.t.run(this.makeNext(next)),

                this.callHook("onend"),
            ])
        })
    }
}
