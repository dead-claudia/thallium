"use strict"

var path = require("path")
var resolve = require("resolve")
var gs = require("glob-stream")

var parseArgs = require("./parse-args.js")
var methods = require("../util/methods.js")
var Exit = require("./errors.js").Exit
var readConfig = require("./config.js")
var nextTick = require("../util/timers.js").nextTick

module.exports = function (cwd, argv, next) {
    return new CliEngine(cwd, argv, next).run()
}

function CliEngine(cwd, argv, callback) {
    this.oldCwd = cwd

    try {
        this.args = parseArgs(cwd, argv)
        this.error = null
    } catch (e) {
        if (e instanceof Exit) {
            this.args = null
            this.error = e.error
        } else {
            throw e
        }
    }

    this.callback = callback
    this.data = null
}

function fixExtension(config, files) {
    if (!files.set) {
        var ext = config != null ? path.extname(config) : ".js"

        // Don't resolve this yet.
        files.value = [path.join(".", "test", "**", "*" + ext)]
    }
}

function loadRequires(cwd, requires) {
    var opts = {basedir: cwd}
    var techtonic = resolve.sync("techtonic", opts)

    requires.forEach(function (req) {
        var res = resolve.sync(req, opts)

        /* eslint-disable global-require */

        req.register(require(res))

        /* eslint-enable global-require */
    })

    return techtonic
}

methods(CliEngine, {
    finish: function (err) {
        var callback = this.callback

        this.callback = null
        process.chdir(this.oldCwd)
        return nextTick(callback, err)
    },

    makeNext: function (next) {
        var self = this
        var called = false

        return function (err, data) {
            if (called) return
            called = true
            if (err != null) {
                nextTick(self.finish.bind(self), err)
            } else {
                nextTick(next, data)
            }
        }
    },

    resolveCallback: function (func, inst, default_, next) {
        if (typeof func !== "function") {
            return nextTick(next, default_)
        }

        var callback = this.makeNext(next)

        try {
            var res = func.call(inst, callback)

            if (res != null && typeof res.then === "function") {
                res.then(callback.bind(null, null), callback)
            }

            return undefined
        } catch (e) {
            return nextTick(callback, e)
        }
    },

    callHook: function (name) {
        var self = this

        return function (result, next) {
            return self.resolveCallback(result[name], result, undefined, next)
        }
    },

    requireConfig: function (next) {
        var config = this.data.config
        var result

        if (config != null) {
            try {
                result = require(config) // eslint-disable-line global-require
            } catch (e) {
                return this.finish(e)
            }
        }

        return this.resolveCallback(result, undefined, result, next)
    },

    // The null checks do parse out the defaults.
    opt: function (result, name, def) {
        if (result != null && !this.args[name].set && result[name] != null) {
            return result[name]
        } else {
            return def(this)
        }
    },

    parseResult: function (techtonic, result) {
        return {
            result: result != null ? result : {},

            files: this.opt(result, "files", function (inst) {
                return inst.args.files.value
            }),

            t: this.opt(result, "techtonic", function (inst) {
                var mod = inst.opt(result, "module", function () {
                    return techtonic
                })

                return require(mod) // eslint-disable-line global-require
            }),
        }
    },

    // Impure fixed-point combinator to clean up a *lot* of repetition.
    iterate: function (init, funcs) {
        var self = this

        function loop(result, i) {
            if (i === funcs.length) return self.finish()

            try {
                return funcs[i](result, function (result) {
                    // Don't kill the stack
                    return nextTick(loop, result, i + 1)
                })
            } catch (e) {
                return self.finish(e)
            }
        }

        return loop(init, 0)
    },

    run: function () {
        if (this.args == null) {
            return this.finish(this.error)
        }

        var techtonic
        var self = this

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

        return this.requireConfig(function (result) {
            return self.iterate(self.parseResult(techtonic, result), [
                self.callHook("oninit"),

                function (result, next) {
                    var callback = self.makeNext(next)

                    gs.createStream(result.files, {allowEmpty: true})
                    .on("error", callback)
                    .on("data", function (data) {
                        // This will never be equal if `this.data.config` is
                        // `null`.
                        /* eslint-disable global-require */

                        if (data !== self.data.config) require(data)

                        /* eslint-enable global-require */
                    })
                    .on("end", callback)
                },

                self.callHook("onload"),

                function (result, next) {
                    return result.t.run(self.makeNext(next))
                },

                self.callHook("onend"),
            ])
        })
    },
})
