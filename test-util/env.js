"use strict"
/* global process */
process.env.NODE_ENV = "development"

// Polyfill the promise
if (typeof Promise !== "function") {
    /* eslint-disable global-require */
    global.Promise = require("bluebird")
    /* eslint-enable global-require */
}
