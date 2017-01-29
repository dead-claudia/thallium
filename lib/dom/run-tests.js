"use strict"

var Util = require("../util")
var D = require("./inject")
var now = Date.now // Avoid Sinon's mock
var hasOwn = Object.prototype.hasOwnProperty

/**
 * Test runner and script loader
 */

function uncached(file) {
    if (file.indexOf("?") < 0) {
        return file + "?loaded=" + now()
    } else {
        return file + "&loaded=" + now()
    }
}

function loadScript(file, timeout) {
    return new Promise(function (resolve, reject) {
        var timer = global.setTimeout(function () {
            fail(new Error("Timeout exceeded loading '" + file + "'"))
        }, timeout)
        var script = D.document.createElement("script")

        script.src = uncached(file)
        script.onload = function (ev) {
            ev.preventDefault()
            ev.stopPropagation()
            global.clearTimeout(timer)
            D.document.head.removeChild(script)
            resolve()
        }

        script.onerror = function (ev) {
            ev.preventDefault()
            ev.stopPropagation()
            fail(ev)
        }

        D.document.head.appendChild(script)

        function fail(e) {
            global.clearTimeout(timer)
            D.document.head.removeChild(script)
            reject(e)
        }
    })
}

function tryDelete(key) {
    try {
        delete global[key]
    } catch (_) {
        // ignore
    }
}

module.exports = function (opts, state) {
    opts.thallium.clearTests()

    // Detect and remove globals created by loaded scripts.
    var found = Object.keys(global)
    var globals = Object.create(null)

    for (var i = 0; i < found.length; i++) {
        globals[found[i]] = global[found[i]]
    }

    function reclaim() {
        var found = Object.keys(global)

        for (var i = 0; i < found.length; i++) {
            var key = found[i]

            if (!hasOwn.call(globals, key) || globals[key] !== global[key]) {
                tryDelete(key)
            }
        }
    }

    return Promise.resolve()
    .then(function () {
        state.pass.textContent = "0"
        state.fail.textContent = "0"
        state.skip.textContent = "0"
        return opts.preload()
    })
    .then(function () {
        return Util.peach(opts.files, function (file) {
            return loadScript(file, opts.timeout)
        })
    })
    .then(function () { return opts.prerun() })
    .then(function () { return opts.thallium.run() })
    .then(function () { return opts.postrun() })
    .catch(function (e) {
        return Promise.resolve(opts.error(e)).then(function () { throw e })
    })
    .then(reclaim, function (e) { reclaim(); throw e })
}
