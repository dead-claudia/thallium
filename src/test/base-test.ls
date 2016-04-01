'use strict'

require! {
    './test': {Test}
    './common': {runTests, report}
    '../util/util': {r}
}

run = ->
    @running = true

    report @, r 'start' .bind @
    .then ->
        # Only unset it to run the tests.
        @initializing = false
        runTests @, r 'pass'
    .finally !-> @initializing = true
    .then -> report @, r 'end'
    .then -> report @, r 'exit'
    .finally !-> @running = false

export BaseTest = (methods) ->
    Test! <<<
        methods: methods
        index: 0
        reporters: []
        isBase: true
        initializing: true
        run: run
