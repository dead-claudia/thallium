"use strict"
/* global process */
process.env.NODE_ENV = "development"

// Polyfill the promise
if (typeof Promise === "undefined") {
    /* eslint-disable global-require */
    global.Promise = require("es6-promise")
    /* eslint-enable global-require */
}
