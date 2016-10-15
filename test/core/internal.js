"use strict"

describe("core (internal)", function () {
    describe("createReport()", function () {
        var Report = Util.Tests.Report
        var Types = Util.Tests.Types
        var create = Util.n

        it("correctly creates `start` reports", function () {
            var report = create("start", [], {value: "hello"})
            var expected = new Report(Types.Start, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports", function () {
            var report = create("enter", [], {value: "hello"})
            var expected = new Report(Types.Enter, [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration", function () {
            var report = create("enter", [], {value: "hello"}, 20)
            var expected = new Report(Types.Enter, [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with slow", function () {
            var report = create("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Enter, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Enter, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `leave` reports", function () {
            var report = create("leave", [], {value: "hello"})
            var expected = new Report(Types.Leave, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports", function () {
            var report = create("pass", [], {value: "hello"})
            var expected = new Report(Types.Pass, [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration", function () {
            var report = create("pass", [], {value: "hello"}, 20)
            var expected = new Report(Types.Pass, [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with slow", function () {
            var report = create("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Pass, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Pass, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports", function () {
            var report = create("fail", [], {value: "hello"})
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration", function () {
            var report = create("fail", [], {value: "hello"}, 20)
            var expected = new Report(Types.Fail, [], {value: "hello"}, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with slow", function () {
            var report = create("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `skip` reports", function () {
            var report = create("skip", [], {value: "hello"})
            var expected = new Report(Types.Skip, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `end` reports", function () {
            var report = create("end", [], {value: "hello"})
            var expected = new Report(Types.End, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `error` reports", function () {
            var report = create("error", [], {value: "hello"})
            var expected = new Report(Types.Error, [], {value: "hello"}, -1, 0)

            assert.match(report, expected)
        })

        context("type checkers", function () {
            it("correctly identifies `start` reports", function () {
                var report = create("start", [])

                assert.equal(report.start, true)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `enter` reports", function () {
                var report = create("enter", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, true)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `leave` reports", function () {
                var report = create("leave", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, true)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `pass` reports", function () {
                var report = create("pass", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, true)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `fail` reports", function () {
                var report = create("fail", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, true)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `skip` reports", function () {
                var report = create("skip", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, true)
                assert.equal(report.end, false)
                assert.equal(report.error, false)
            })

            it("correctly identifies `end` reports", function () {
                var report = create("end", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, true)
                assert.equal(report.error, false)
            })

            it("correctly identifies `error` reports", function () {
                var report = create("error", [])

                assert.equal(report.start, false)
                assert.equal(report.enter, false)
                assert.equal(report.leave, false)
                assert.equal(report.pass, false)
                assert.equal(report.fail, false)
                assert.equal(report.skip, false)
                assert.equal(report.end, false)
                assert.equal(report.error, true)
            })
        })

        context("type()", function () {
            it("returns correct value for `start` reports", function () {
                assert.match(create("start", []).type, "start")
            })

            it("returns correct value for `enter` reports", function () {
                assert.match(create("enter", []).type, "enter")
            })

            it("returns correct value for `leave` reports", function () {
                assert.match(create("leave", []).type, "leave")
            })

            it("returns correct value for `pass` reports", function () {
                assert.match(create("pass", []).type, "pass")
            })

            it("returns correct value for `fail` reports", function () {
                assert.match(create("fail", []).type, "fail")
            })

            it("returns correct value for `skip` reports", function () {
                assert.match(create("skip", []).type, "skip")
            })

            it("returns correct value for `end` reports", function () {
                assert.match(create("end", []).type, "end")
            })

            it("returns correct value for `error` reports", function () {
                assert.match(create("error", []).type, "error")
            })
        })
    })
})
