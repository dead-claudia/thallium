describe("core (attempts)", function () {
    "use strict"

    var n = Util.n
    var p = Util.p

    function immediate(retries) {
        if (--retries.value) throw new Error("fail")
    }

    function deferred(retries) {
        return {then: function (resolve, reject) {
            if (--retries.value) reject(new Error("fail"))
            resolve()
        }}
    }

    it("succeeds with own immediate", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 3}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            return immediate(retries)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("succeeds with own deferred", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 3}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            return deferred(retries)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("fails with own immediate", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 5}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            return immediate(retries)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("test", 0)], new Error("fail")),
                n.end(),
            ])
        })
    })

    it("fails with own deferred", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 5}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            return deferred(retries)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("test", 0)], new Error("fail")),
                n.end(),
            ])
        })
    })

    it("succeeds with inherited", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 3}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            tt.test("inner", function () { return immediate(retries) })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.pass([p("test", 0), p("inner", 0)]),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("fails with inherited", function () {
        var tt = Util.create()
        var ret = []
        var retries = {value: 5}

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.attempts = 3
            tt.test("inner", function () { return deferred(retries) })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.fail([p("test", 0), p("inner", 0)], new Error("fail")),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    function attempts(reflect) {
        return reflect.attempts
    }

    it("gets own attempts", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            tt.attempts = 5
            active = tt.call(attempts)
        })

        return tt.run().then(function () {
            assert.equal(active, 5)
        })
    })

    it("gets inherited attempts", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            tt.attempts = 5
            tt.test("inner", function () {
                active = tt.call(attempts)
            })
        })

        return tt.run().then(function () {
            assert.equal(active, 5)
        })
    })

    it("gets default attempts", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            active = tt.call(attempts)
        })

        return tt.run().then(function () {
            assert.equal(active, 1)
        })
    })
})
