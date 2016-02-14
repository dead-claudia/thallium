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

// node-interpret has a special process for each entry.
function checkExt(file, ext) {
    var config = file + ext
    if (!fs.statSync(config).isFile()) {
        return null
    }

    var values = interpret.jsVariants[ext]

    // Easy and common case - nothing to try to load.
    if (values == null) return {config: config, values: []}

    if (!Array.isArray(values)) values = [values]

    return {
        config: config,
        values: values.map(function (value) {
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

function sys(message, code, errno, syscall, e) {
    message = code + ": " + message
    if (syscall != null) message += ", " + syscall
    if (e == null) e = new Error(message)
    else e.message = message
    e.code = code
    e.errno = errno
    e.syscall = syscall
    return e
}

methods(ConfigReader, {
    readFail: function () {
        if (this.config.set) {
            throw sys("illegal operation on a directory", "EISDIR", -21, "read")
        } else {
            throw sys("no test config found", "ENOTESTCONFIG", 0, null)
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
                    if (fs.statSync(config + ext).isFile()) {
                        return {
                            config: config + ext,
                            values: [{
                                module: value,
                                register: function () {},
                            }],
                        }
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
        // Infer the extension of the config file and queue that to load
        // later.
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

        return o(fs.statSync(config).isFile())
        // Explicit extensions take precedence over implicit inference.
        .map(function (test) { if (!test) return self.getValues() })
        .else(function () { return self.readFail() })
        .value
    },
})
