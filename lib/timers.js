"use strict"

/* eslint-env node */

var util = require("./core-utils.js")

// Node 0.x need the dispatcher, but the others don't.
exports.nextTick = /^v0\./.test(process.version)
    ? util.dispatcher(process.nextTick)
    : process.nextTick

exports.poll = setImmediate
