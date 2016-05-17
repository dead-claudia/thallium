"use strict"

const Test = require("./test.js")
const r = require("../util.js").r
const Common = require("./common.js")

class Timer {
    constructor(ctx) {
        this.ctx = ctx
        this.start = Date.now()
    }

    check() {
        const length = Date.now() - this.start
        const timeout = Common.getTimeout(this.ctx)

        if (length > timeout) {
            return Common.timeoutFail(timeout)
        } else {
            return null
        }
    }
}

exports.Inline = class Inline extends Test {
    constructor(methods, name, index, callback) {
        super()

        this.name = name
        this.index = index
        this.callback = callback
        this.parent = methods._

        // Initialize the test now, because the methods are immediately
        // returned, instead of being revealed through the callback.
        this.inline = []
        this.initializing = true
        this.methods = Object.create(methods)
        this.methods._ = this
    }

    init() {
        const timer = new Timer(this)

        for (const test of this.inline) {
            try {
                test.run.apply(undefined, test.args)
            } catch (e) {
                // Stop immediately like what block tests do.
                return r("fail", e)
            }
        }

        const err = timer.check()

        if (err != null) return r("fail", err)
        return r("pass")
    }
}

exports.Block = class Block extends Test {
    constructor(methods, name, index, callback) {
        super()

        this.name = name
        this.index = index
        this.callback = callback
        this.methods = methods
        this.parent = methods._
    }

    init() {
        const methods = Object.create(this.methods)

        methods._ = this

        try {
            const timer = new Timer(this)

            this.callback.call(methods, methods)

            const err = timer.check()

            if (err != null) throw err
            return r("pass")
        } catch (e) {
            return r("fail", e)
        }
    }
}
