import {report} from "./common.js"
import {r} from "../util/util.js"
import {Test} from "./test.js"
import {InlineTest as LiveInlineTest} from "./inline-test.js"

function runPendingTest(ctx, isMain) {
    ctx.running = true
    return report(ctx, r("pending"))
    .finally(() => { ctx.running = false })
    .then(() => isMain && report(ctx, r("exit")))
}

/**
 * This has to be an inline test subclass, because the methods still have to be
 * exposed, even though the tests aren't run.
 */
export class InlineTest extends LiveInlineTest {
    run(isMain) { return runPendingTest(this, isMain) }
}

export class BlockTest extends Test {
    constructor(methods, name, index) {
        super()
        this.methods = methods
        this.name = name
        this.index = index
        this.parent = methods._
    }

    run(isMain) { return runPendingTest(this, isMain) }
}
