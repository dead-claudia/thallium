"use strict"

var path = require("path")
var resolve = require("resolve")
var gs = require("glob-stream")

var parseArgs = require("./parse-args.js")
var methods = require("../util/methods.js")
var Exit = require("./errors.js").Exit
var readConfig = require("./config.js")

var nextTick = require("../timers.js").nextTick

module.exports = function (cwd, argv, next) {
    return new CliEngine(cwd, argv, next).run()
}

function CliEngine(cwd, argv, callback) {
    this.oldCwd = cwd

    try {
        this.args = parseArgs(argv)
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
        // Don't resolve this yet.
        files.value = [path.join(".", "test", "**", "*" + path.extname(config))]
    }
}

function loadRequires(config, requires) {
    var opts = {basedir: path.dirname(config)}
    var techtonic = resolve.sync("techtonic", opts)

    requires.forEach(function (req) {
        var res = resolve.sync(req)

        /* eslint-disable global-require */
        req.register(require(res))
        /* eslint-enable global-require */
    })

    return techtonic
}

// Impure fixed-point combinator to clean up a *lot* of repetition.
function iterate(inst, init, funcs) {
    function loop(result, i) {
        if (i === funcs.length) return inst.finish()

        try {
            return funcs[i](result, function (result) {
                // Don't kill the stack
                return nextTick(loop, result, i + 1)
            })
        } catch (e) {
            return inst.finish(e)
        }
    }

    return loop(init, 0)
}

methods(CliEngine, {
    finish: function (err) {
        var callback = this.callback
        this.callback = null
        process.chdir(this.oldCwd)
        return callback(err)
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
        /* eslint-disable global-require */
        var result = require(this.data.config)
        /* eslint-enable global-require */
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

    run: function () {
        if (this.args == null) {
            return this.finish(this.error)
        }

        // This is a no-op if --cwd was not passed/is already the current
        // working directory.
        process.chdir(this.args.cwd.value)

        this.data = readConfig(this.args.config, this.args.register)
        fixExtension(this.data.config, this.args.files)

        var techtonic = loadRequires(this.data.config, this.data.requires)
        var self = this

        return this.requireConfig(function (result) {
            return iterate(self, self.parseResult(techtonic, result), [
                self.callHook("oninit"),

                function (result, next) {
                    var callback = self.makeNext(next)
                    gs.createStream(result.files, {allowEmpty: true})
                    .on("error", callback)
                    .on("data", function (data) {
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
