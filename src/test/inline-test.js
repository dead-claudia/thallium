import Test from "./test.js"
import {r} from "../util/util.js"

export default class InlineTest extends Test {
    constructor(methods, name, index) {
        super()

        // Initialize the test now, because the methods are immediately
        // returned, instead of being revealed through the callback.

        this.name = name
        this.index = index
        this.parent = methods._
        this.methods = Object.create(methods)
        this.methods._ = this
        this.inline = []
        this.initializing = true
    }

    init() {
        for (const inline of this.inline) {
            try {
                inline.run.apply(undefined, inline.args)
            } catch (e) {
                // Stop immediately like what block tests do.
                return r("fail", e)
            }
        }

        return r("pass")
    }
}
