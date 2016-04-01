'use strict'

/**
 * This contains all the fake namespaces
 */

require! {
    './common': {report}
    '../util/util': {r}
    './test': {Test}
    './sync': {InlineTest}
}

createFakeNs = (run) ->
    /**
     * This has to look like an inline test, because the methods still have to be
     * exposed, even though the tests aren't run.
     */
    InlineTest: InlineTest >> (<<< {run})

    BlockTest: (methods, name, index) ->
        Test! <<< {methods, name, index, run, parent: methods._}

export dummy = createFakeNs !->
export skip = createFakeNs (isMain) ->
    @running = true
    report @, r 'pending' .bind @
    .finally !-> @running = false
    .then -> report @, r 'exit' if isMain
    .bind void .return void
