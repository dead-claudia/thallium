'use strict'

require! {
    './common': {report}
    '../util/util': {r}
    './test': {Test}
    './inline-test': {InlineTest: LiveInlineTest}
}

runPendingTest = (isMain) ->
    @running = true
    report @, r "pending" .bind @
    .finally !-> @running = false
    .then -> isMain and report @, r "exit"
    .bind void .return void

/**
 * This has to be an inline test subclass, because the methods still have to be
 * exposed, even though the tests aren't run.
 */
export class InlineTest extends LiveInlineTest
    run: runPendingTest

export class BlockTest extends Test
    (@methods, @name, @index) ->
        super!
        @parent = @methods._

    run: runPendingTest
