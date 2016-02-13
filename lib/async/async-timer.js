"use strict"

var methods = require("../methods.js")
var templates = require("../constants.js").templates
var timers = require("../timers.js")

module.exports = AsyncTimer
function AsyncTimer(onfail) {
    this.timeout = 0
    this.initial = 0
    this.onfail = onfail
    this.resolved = false
}

// The polling is slightly performance-sensitive, since it's used to keep
// track of time (and needs to be relatively accurate). The reason
// `setTimeout` isn't used by default is because other things can interfere
// with reasonable timing (like heavy use of this very function), and the
// other event loop primitives are almost always faster and more precise.
function continuePoll(ctx) {
    return ctx.poll()
}

methods(AsyncTimer, {
    poll: function () {
        if (this.resolved) return

        if (Date.now() - this.initial >= this.timeout) {
            return this.timerFail()
        } else {
            return timers.poll(continuePoll, this)
        }
    },

    timerFail: function () {
        return (0, this.onfail)(new Error(templates.timeoutFail(this.timeout)))
    },

    start: function (timeout) {
        this.timeout = timeout
        this.initial = Date.now()
        this.poll()
    },
})
