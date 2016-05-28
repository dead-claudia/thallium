"use strict"

// TODO: use Karma once 1.0 is out. See this merged PR for more details.
// https://github.com/karma-runner/karma/pull/1825

/* eslint-env node */

require("./scripts/generate-browser-entry.js")

module.exports = function (config) {
    config.set({
        // enable / disable watching file and executing tests whenever any file
        // changes
        autoWatch: true,

        // base path that will be used to resolve all patterns (eg. files,
        // exclude)
        basePath: __dirname,

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ["mocha"],

        // list of files / patterns to load in the browser
        files: [
            {pattern: "lib/**/*.js", included: false, nocache: true},
            {pattern: "test/**/*.js", included: false, nocache: true},
            {pattern: "helpers/base.js", included: false, nocache: true},
            {pattern: "r/**/*.js", included: false, nocache: true},
            {
                pattern: "node_modules/browserify-loader/browserify-loader.js",
                watched: false,
                included: true,
            },
        ],

        // list of files to exclude
        exclude: [
            "../lib/cli/**/*.js",
            "../test/cli/**/*.js",
        ],

        // test results reporter to use
        // possible values: "dots", "progress"
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ["dots"],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
        // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["Chrome"],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,
    })
}
