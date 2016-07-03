"use strict"

exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
})

exports.windowWidth = 75

if (global.process && global.process.stdout && global.process.stdout._write) {
    /**
     * This contains the Node-specific reporter stuff.
     */

    // aliased require used to stop Browserify from inserting this built-in
    var tty = (0, require)("tty")
    var stdout = global.process.stdout
    var isWindows = global.process.platform === "win32"

    /**
     * Default symbol map.
     */
    if (isWindows) {
        // With node.js on Windows: use symbols available in terminal default
        // fonts
        exports.Symbols = Object.freeze({
            Pass: "\u221A",
            Fail: "\u00D7",
            Dot: ".",
        })
    }

    if (tty.isatty(1) && tty.isatty(2)) {
        if (global.process.stdout.columns) {
            exports.windowWidth = stdout.columns
        } else if (stdout.getWindowSize) {
            exports.windowWidth = stdout.getWindowSize(1)[0]
        } else if (tty.getWindowSize) {
            exports.windowWidth = tty.getWindowSize()[1]
        }
    }

    var newline = exports.newline = isWindows ? "\r\n" : "\n"
    var lastIsNewline = true

    exports.defaultOpts = {
        log: function (line, callback) {
            lastIsNewline = true
            return stdout.write(line + newline, "utf-8", callback)
        },

        write: function (str, callback) {
            lastIsNewline = str.slice(-1) !== "\n"
            return stdout.write(str, "utf-8", callback)
        },

        reset: function (callback) {
            if (!lastIsNewline) {
                return stdout.write(newline, "utf-8", callback)
            } else {
                return callback()
            }
        },
    }

    /**
     * Derived from supports-color, but with all the `level` whatever and all
     * the other useless crud this doesn't need from that. Also, it ignores CLI
     * flags, and can be force-set.
     */
    exports.colorSupport = (function () {
        var env = global.process.env

        if (env.FORCE_COLOR) return 0x3
        if (env.FORCE_NO_COLOR) return 0x2
        if (!stdout.isTTY) return 0x0
        if (isWindows) return 0x1
        if (env.CI || env.TEAMCITY_VERSION) return 0x0
        if (env.COLORTERM) return 0x1
        if (env.TERM === "dumb") return 0x0
        if (/^xterm-256(color)?/.test(env.TERM)) return 0x1
        return /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)|0
    })()
} else {
    exports.newline = "\n"

    /**
     * Since browsers don't have unbuffered output, this kind of simulates it.
     */

    var console = global.console
    var acc = ""

    exports.defaultOpts = {
        reset: function (callback) {
            if (acc !== "") {
                console.log(acc)
                acc = ""
            }

            callback()
        },

        log: function (line, callback) {
            return this.write(line + "\n", callback)
        },

        write: function (str, callback) {
            acc += str

            var index = str.indexOf("\n")

            if (index >= 0) {
                var lines = str.split("\n")

                acc = lines.pop()

                for (var i = 0; i < lines.length; i++) {
                    console.log(lines[i])
                }
            }

            return callback()
        },
    }

    // Conveniently unforced and unsupported, since you can only specify
    // line-by-line colors via CSS, and even that isn't very portable.
    exports.colorSupport = 0
}
