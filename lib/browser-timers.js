"use strict"

var util = require("./core-utils.js")

/* eslint-env browser */

// rAF doesn't work well for polling, since it carries *too* much importance and
// thus will block normal execution. It might be preferable in browsers to
// include a setImmediate polyfill if this runs too slow, but the performance
// needs tested first.

if (typeof requestAnimationFrame === "function") {
    // This is the fastest version for browsers.
    exports.nextTick = util.dispatcher(requestAnimationFrame)
}

if (typeof window.setImmediate === "function") {
    exports.poll = util.dispatcher(window.setImmediate)
} else {
    exports.poll = util.dispatcher(setTimeout, 4)
}

exports.nextTick = exports.nextTick || exports.poll
