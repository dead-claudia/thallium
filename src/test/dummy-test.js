import {Test} from "./test.js"
import {InlineTest as LiveInlineTest} from "./inline-test.js"

/**
 * This has to be an inline test subclass, because the methods still have to be
 * exposed, even though the tests aren't run.
 */
export class InlineTest extends LiveInlineTest {
    run() {}
}

export class BlockTest extends Test {
    constructor(methods, name, index) {
        super()
        this.methods = methods
        this.name = name
        this.index = index
        this.parent = methods._
    }

    run() {}
}
