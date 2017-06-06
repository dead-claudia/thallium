describe("core/failable", function () {
    "use strict"

    var n = t.internal.reports
    var p = t.internal.location

    function immediate() {
        throw new Error("fail")
    }

    function deferred() {
        return {then: function (resolve, reject) {
            reject(new Error("fail"))
        }}
    }

    it("works with own immediate", function () {
        var tt = t.internal.root()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.isFailable = true
            return immediate()
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail(
                    [p("test", 0)], new Error("fail"),
                    undefined, undefined, true),
                n.end(),
            ])
        })
    })

    it("works with own deferred", function () {
        var tt = t.internal.root()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.isFailable = true
            return deferred()
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail(
                    [p("test", 0)], new Error("fail"),
                    undefined, undefined, true),
                n.end(),
            ])
        })
    })

    it("works with inherited", function () {
        var tt = t.internal.root()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.isFailable = true
            tt.test("inner", function () { return immediate() })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.fail(
                    [p("test", 0), p("inner", 0)], new Error("fail"),
                    undefined, undefined, true),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    function isFailable(reflect) {
        return reflect.isFailable
    }

    it("gets own isFailable", function () {
        var tt = t.internal.root()
        var active

        tt.test("test", function () {
            tt.isFailable = true
            active = tt.call(isFailable)
        })

        return tt.run().then(function () {
            assert.equal(active, true)
        })
    })

    it("gets inherited isFailable", function () {
        var tt = t.internal.root()
        var active

        tt.test("test", function () {
            tt.isFailable = true
            tt.test("inner", function () {
                active = tt.call(isFailable)
            })
        })

        return tt.run().then(function () {
            assert.equal(active, true)
        })
    })

    it("gets default isFailable", function () {
        var tt = t.internal.root()
        var active

        tt.test("test", function () {
            active = tt.call(isFailable)
        })

        return tt.run().then(function () {
            assert.equal(active, false)
        })
    })
})
