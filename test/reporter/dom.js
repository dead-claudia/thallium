"use strict"

// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter dom", function () {
    // Skip if jsdom doesn't exist
    if (!Util.jsdom) return

    var mock = Util.jsdom()
    var p = Util.p
    var n = Util.n

    it("is not itself a reporter", function () {
        var dom = Util.r.dom

        assert.throws(function () { dom(n("start", [])) }, TypeError)
        assert.throws(function () { dom(n("enter", [p("test", 0)])) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { dom(n("leave", [p("test", 0)])) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { dom(n("pass", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dom(n("fail", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dom(n("skip", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dom(n("end", [])) }, TypeError)
    })

    function test(name, opts) { // eslint-disable-line no-unused-vars
        (opts.skip ? it.skip : it)(name, function () {
            var shared = {}
            var reporterOpts = {
                inst: Util.create(),
                opts: {window: mock.window()},
            }

            if (opts.setup) opts.setup(shared, mock, reporterOpts)

            var reporter = Util.r.dom.reporter(reporterOpts)

            return Util.peach(opts.input, reporter).then(function () {
                if (opts.match) opts.match(shared, mock)
            })
        })
    }

    // TODO: write a ton of tests
})
