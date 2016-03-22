'use strict'

require! {
    './test': {Test}
    './inline-test': {InlineTest: LiveInlineTest}
}

/**
 * This has to be an inline test subclass, because the methods still have to be
 * exposed, even though the tests aren't run.
 */
export class InlineTest extends LiveInlineTest
    run: !->

export class BlockTest extends Test
    (@methods, @name, @index) ->
        super!
        @parent = @methods._

    run: !->
