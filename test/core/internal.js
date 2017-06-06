describe("core/internal", function () {
    "use strict"

    describe("reports", function () {
        var Reports = Util.Reports
        var n = Util.n

        it("correctly creates `start` reports", function () {
            var report = n.start()
            var expected = new Reports.Start()

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports", function () {
            var report = n.enter([])
            var expected = new Reports.Enter([], 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration", function () {
            var report = n.enter([], 20)
            var expected = new Reports.Enter([], 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with slow", function () {
            var report = n.enter([], undefined, 10)
            var expected = new Reports.Enter([], 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = n.enter([], 20, 10)
            var expected = new Reports.Enter([], 20, 10)

            assert.match(report, expected)
        })

        it("correctly creates `leave` reports", function () {
            var report = n.leave([])
            var expected = new Reports.Leave([])

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports", function () {
            var report = n.pass([])
            var expected = new Reports.Pass([], 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration", function () {
            var report = n.pass([], 20)
            var expected = new Reports.Pass([], 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with slow", function () {
            var report = n.pass([], null, 10)
            var expected = new Reports.Pass([], 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = n.pass([], 20, 10)
            var expected = new Reports.Pass([], 20, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports", function () {
            var report = n.fail([], {value: "hello"})
            var expected = new Reports.Fail([], {value: "hello"}, 10, 75, false)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration", function () {
            var report = n.fail([], {value: "hello"}, 20)
            var expected = new Reports.Fail([], {value: "hello"}, 20, 75, false)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with slow", function () {
            var report = n.fail([], {value: "hello"}, null, 10)
            var expected = new Reports.Fail([], {value: "hello"}, 10, 10, false)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = n.fail([], {value: "hello"}, 20, 10)
            var expected = new Reports.Fail([], {value: "hello"}, 20, 10, false)

            assert.match(report, expected)
        })

        it("correctly creates `skip` reports", function () {
            var report = n.skip([])
            var expected = new Reports.Skip([])

            assert.match(report, expected)
        })

        it("correctly creates `end` reports", function () {
            var report = n.end()
            var expected = new Reports.End()

            assert.match(report, expected)
        })

        it("correctly creates `error` reports", function () {
            var report = n.error({value: "hello"})
            var expected = new Reports.Error({value: "hello"})

            assert.match(report, expected)
        })

        context("type checkers", function () {
            it("correctly identifies `start` reports", function () {
                var report = n.start()

                assert.equal(report.isStart, true)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `enter` reports", function () {
                var report = n.enter([])

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, true)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `leave` reports", function () {
                var report = n.leave([])

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, true)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `pass` reports", function () {
                var report = n.pass([])

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, true)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `fail` reports", function () {
                var report = n.fail([])

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, true)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `skip` reports", function () {
                var report = n.skip([])

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, true)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `end` reports", function () {
                var report = n.end()

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, true)
                assert.equal(report.isError, false)
            })

            it("correctly identifies `error` reports", function () {
                var report = n.error()

                assert.equal(report.isStart, false)
                assert.equal(report.isEnter, false)
                assert.equal(report.isLeave, false)
                assert.equal(report.isPass, false)
                assert.equal(report.isFail, false)
                assert.equal(report.isSkip, false)
                assert.equal(report.isEnd, false)
                assert.equal(report.isError, true)
            })
        })

        context("type()", function () {
            it("returns correct value for `start` reports", function () {
                assert.match(n.start().type, "start")
            })

            it("returns correct value for `enter` reports", function () {
                assert.match(n.enter([]).type, "enter")
            })

            it("returns correct value for `leave` reports", function () {
                assert.match(n.leave([]).type, "leave")
            })

            it("returns correct value for `pass` reports", function () {
                assert.match(n.pass([]).type, "pass")
            })

            it("returns correct value for `fail` reports", function () {
                assert.match(n.fail([]).type, "fail")
            })

            it("returns correct value for `skip` reports", function () {
                assert.match(n.skip([]).type, "skip")
            })

            it("returns correct value for `end` reports", function () {
                assert.match(n.end().type, "end")
            })

            it("returns correct value for `error` reports", function () {
                assert.match(n.error().type, "error")
            })
        })
    })
})
