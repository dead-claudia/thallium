"use strict"

/* eslint-env node */

module.exports = function (config) {
    config.set({
        basePath: __dirname,
        restartOnFileChange: true,

        // browsers: ["Chrome", "Firefox", "PhantomJS"]
        frameworks: ["browserify", "mocha"],
        reporters: ["dots"],

        customLaunchers: {
            ChromeTravisCI: {
                base: "Chrome",
                flags: ["--no-sandbox"],
            },

            PhantomJSDebug: {
                base: "PhantomJS",
                debug: true,
            },
        },

        files: [
            "./test-util/globals.js",
            {pattern: "./test/**/*.js", nocache: true},
            {pattern: "./lib/**/*.js", included: false, served: false},
            {pattern: "./scripts/**/*.js", included: false, served: false},
            {pattern: "./r/**/*.js", included: false, served: false},
        ],

        exclude: ["./test/cli/**"],

        preprocessors: {
            "./test-util/globals.js": ["browserify"],
        },

        browserify: {
            debug: true,
            insertGlobals: true,
            fullPaths: true,
        },

        singleRun: !!process.env.TRAVIS,

        // This should be way more than enough.
        browserNoActivityTimeout: process.env.NO_TIMEOUT ? 1000000000 : 10000,
    })
}
