'use strict'

require! {
    '../messages': {m}
    './common': {report, runTests}
    '../util/util': {r}
}

/**
 * This runs the test, and returns a promise resolved when it's done.
 *
 * @param {Test} ctx The current context
 * @param {Boolean} isMain Whether the test is run directly as the main
 *                         test or as a child test.
 */
run = (isMain) ->
    if @running
        throw new Error m 'run.concurrent'

    @running = true

    report @, r 'start' .bind @
    .then ->
        @initializing = true
        @init @
    # If an error occurs, the initialization has already finished (albeit
    # unsuccessfully)
    .finally !-> @initializing = false
    .then (res) ->
        for test of @deinit
            test.initializing = false

        runTests @, res
    .tap -> report @, r 'end'
    .tap (res) -> report @, r res.type, res.value
    .then -> isMain and report @, r 'exit'
    .finally !-> @running = false

export Test = ->
    plugins: []
    tests: []

    # In case this is called out of its own init, that error is caught.
    initializing: false

    # Keep this from being run multiple times concurrently.
    running: false

    # Inline tests need to be marked immediately before running.
    deinit: []

    # 0 means inherit timeout
    timeout: 0

    # Placeholders for pretty shape
    parent: null
    reporters: null
    only: null
    run: run
