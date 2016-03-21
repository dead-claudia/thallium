import {Test} from "./test.js"
import {r} from "../util/util.js"

export class BlockTest extends Test {
    constructor(methods, name, index, callback) {
        super()
        this.methods = methods
        this.name = name
        this.index = index
        this.callback = callback
        this.parent = methods._
    }

    init() {
        const methods = Object.create(this.methods)

        methods._ = this

        try {
            this.callback.call(methods, methods)
        } catch (e) {
            return r("fail", e)
        }

        return r("pass")
    }
}
