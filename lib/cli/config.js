"use strict"

var fs = require("fs")
var interpret = require("interpret")

var methods = require("../util/methods.js")
var o = require("../util/option.js")

var hasOwn = {}.hasOwnProperty

module.exports = function (config, register) {
    return new ConfigReader(config, register).read()
}

function ConfigReader(config, register) {
    this.config = config
    this.register = register
}

function isFile(file) {
    try {
        return fs.statSync(file).isFile()
    } catch (e) {
        if (e.code === "ENOENT") return false
        throw e
    }
}

// node-interpret has a special process for each entry.
function checkExt(file, ext) {
    var config = file + ext

    if (!isFile(config)) {
        return null
    }

    var values = interpret.jsVariants[ext]

    // Easy and common case - nothing to try to load.
    if (values == null) return {config: config, requires: []}

    if (!Array.isArray(values)) values = [values]

    return {
        config: config,
        requires: values.map(function (value) {
            if (typeof value === "string") {
                return {
                    module: value,
                    register: function () {},
                }
            }

            if (typeof value === "object") return value

            // This should never happen.
            throw new TypeError("unreachable")
        }),
    }
}

function makeSystemError(message, opts) {
    message = opts.code + ": " + message
    if (opts.syscall != null) message += ", " + opts.syscall

    var e = opts.original

    if (e == null) e = new Error(message)
    else e.message = message

    e.code = opts.code
    e.errno = opts.errno
    e.syscall = opts.syscall
    return e
}

methods(ConfigReader, {
    readFail: function () {
        if (this.config.set) {
            throw makeSystemError("illegal operation on a directory", {
                code: "EISDIR",
                errno: -21,
                syscall: "read",
            })
        } else {
            // Return the default of just doing its thing.
            throw makeSystemError("no test config found", {
                code: "ENOTESTCONFIG",
                errno: 0,
                syscall: null,
            })
        }
    },

    readSet: function () {
        // This dedupes the extensions, and ensures the last one to take
        // effect is the effective key
        var keys = []
        var exts = {}

        this.register
        // Add a leading dot if it's not there.
        .map(function (pair) { return /^\./.test(pair) ? pair : "." + pair })
        .map(function (pair) {
            if (/:/.test(pair)) {
                // Okay...in reality, the ext:module syntax is really just
                // a glorified pseudo-require.
                return {
                    ext: pair.slice(0, pair.indexOf(":")),
                    mod: pair.slice(pair.indexOf(":") + 1),
                }
            } else if (hasOwn.call(interpret.jsVariants, pair)) {
                return {ext: pair}
            } else {
                throw new Error("Unknown ext passed: " + pair)
            }
        })
        .forEach(function (data) {
            var value = exts[data.ext]

            if (value != null) keys.splice(1, value.index)

            exts[data.ext] = {
                index: keys.length,
                value: data.mod,
            }

            keys.push(data.ext)
        })

        var config = this.config.value

        return keys.reduce(function (acc, ext) {
            return acc.else(function () {
                return o(exts[ext].value).then(function (value) {
                    if (isFile(config + ext)) {
                        return {
                            config: config + ext,
                            requires: [{
                                module: value,
                                register: function () {},
                            }],
                        }
                    } else {
                        return undefined
                    }
                }, function () {
                    // Just reuse the standard path if it has just an extension.
                    // It's easier.
                    return checkExt(config, ext)
                })
            })
        }, o())
    },

    getValues: function () {
        // Explicit extensions take precedence over implicit inference.
        if (this.register.set) return this.readSet()

        var config = this.config.value

        // Infer the extension of the config file and queue that to load later.
        return Object.keys(interpret.jsVariants).reduce(function (acc, ext) {
            return acc.else(function () { return checkExt(config, ext) })
        }, o())
    },

    read: function () {
        // Get the config.
        var config = this.config.set
            ? this.config.value
            : this.config.value + ".js"

        var self = this

        return o(isFile(config))
        // Explicit extensions take precedence over implicit inference.
        .map(function (test) { return test ? self.getValues() : null })
        .else(function () { return self.readFail() })
        .value
    },
})
