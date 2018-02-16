"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var fixture = require("../../test-util/cli/cli").fixture
var GS = require("../../lib/cli/glob-stream")

describe("cli/glob-stream", function () {
    describe("merge()", function () {
        function makeStream() {
            var ref

            function source(listener) {
                ref = listener
                return function () { ref = undefined }
            }
            ["send", "error", "warn", "end"].forEach(function (m) {
                source[m] = function () {
                    if (ref != null) ref[m].apply(ref, arguments)
                }
            })

            return source
        }

        it("emits data from all streams", function (done) {
            var s1 = makeStream()
            var s2 = makeStream()
            var s3 = makeStream()
            var results = []

            GS.merge([s1, s2, s3], {
                send: function (data) { results.push(data) },
                error: function () {},
                warn: function () {},
                end: function () {
                    assert.match(results, [
                        "stream 1",
                        "stream 2",
                        "stream 3",
                    ])
                    done()
                },
            })

            s1.send("stream 1")
            s1.end()

            s2.send("stream 2")
            s2.end()

            s3.send("stream 3")
            s3.end()
        })

        it("emits all data event from each stream", function (done) {
            var s1 = makeStream()
            var s2 = makeStream()
            var results = []

            GS.merge([s1, s2], {
                send: function (data) { results.push(data) },
                error: function () {},
                warn: function () {},
                end: function () {
                    assert.match(results, [
                        "stream 1 data 1",
                        "stream 1 data 2",
                        "stream 1 data 3",
                        "stream 2 data 1",
                        "stream 2 data 2",
                        "stream 2 data 3",
                    ])
                    done()
                },
            })

            s1.send("stream 1 data 1")
            s1.send("stream 1 data 2")
            s1.send("stream 1 data 3")
            s1.end()

            s2.send("stream 2 data 1")
            s2.send("stream 2 data 2")
            s2.send("stream 2 data 3")
            s2.end()
        })

        it("preserves streams order", function (done) {
            var s1 = makeStream()
            var s2 = makeStream()
            var s3 = makeStream()
            var results = []

            GS.merge([s1, s2, s3], {
                send: function (data) { results.push(data) },
                error: function () {},
                warn: function () {},
                end: function () {
                    assert.match(results, [
                        "stream 1",
                        "stream 2",
                        "stream 3",
                    ])
                    done()
                },
            })

            s2.send("stream 2")
            s3.send("stream 3")
            s1.send("stream 1")
            s2.end()
            s3.end()
            s1.end()
        })

        it("emits stream errors downstream", function (done) {
            var s1 = makeStream()
            var s2 = makeStream()
            var streamData = []

            GS.merge([s1, s2], {
                send: function (data) { streamData.push(data) },
                error: function (err) {
                    try {
                        assert.isObject(err)
                        assert.hasOwn(err, "message", "stop")
                        assert.match(streamData, ["okay"])
                        return done()
                    } catch (e) {
                        return done(e)
                    }
                },
                warn: function () { done(new Error("Expected no warnings")) },
                end: function () { done(new Error("Expected an error")) },
            })

            s1.send("okay")
            s2.error(new Error("stop"))
            s1.end()
        })

        it("doesn't emit buffered items after errors", function (done) {
            var s1 = makeStream()
            var s2 = makeStream()
            var streamData = []

            GS.merge([s1, s2], {
                send: function (data) { streamData.push(data) },
                error: function (err) {
                    try {
                        assert.isObject(err)
                        assert.hasOwn(err, "message", "stop")
                        assert.match(streamData, [])
                        return done()
                    } catch (e) {
                        return done(e)
                    }
                },
                warn: function () { done(new Error("Expected no warnings")) },
                end: function () { done(new Error("Expected an error")) },
            })

            s2.send("okay")
            s1.error(new Error("stop"))
            s2.end()
        })
    })

    describe("create() (FLAKE)", /** @this */ function () { // eslint-disable-line max-statements, max-len
        this.retries(3)

        var oldCwd = process.cwd()

        beforeEach(function () { process.chdir(__dirname) })
        afterEach(function () { process.chdir(oldCwd) })

        function read(globs) {
            return new Promise(function (resolve, reject) {
                var list = []

                GS.create(globs, {
                    send: function (file) { list.push(file) },
                    warn: function () {},
                    error: reject,
                    end: function () { resolve(list) },
                })
            })
        }

        it("doesn't emit single folders", function () {
            return read([fixture("glob-stream/whatsgoingon")])
            .then(function (list) {
                assert.match(list, [])
            })
        })

        it("doesn't emit glob folders", function () {
            return read([fixture("glob-stream/whatsgoingon/*/")])
            .then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a file name stream from a glob", function () {
            return read([fixture("glob-stream/*.coffee")])
            .then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns a file name stream that does not duplicate", function () {
            return read([
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/test.coffee"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns a file name stream from a direct path", function () {
            return read([fixture("glob-stream/test.coffee")])
            .then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns no files with dotfiles", function () {
            return read([fixture("glob-stream/*swag")]).then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a correctly ordered file name stream for three globs + globstars", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/**/test.txt"),
                fixture("glob-stream/**/test.coffee"),
                fixture("glob-stream/**/test.js"),
            ]).then(function (list) {
                assert.match(list, [
                    fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                    fixture("glob-stream/test.coffee"),
                    fixture("glob-stream/whatsgoingon/test.js"),
                ])
            })
        })

        it("returns a correctly ordered file name stream for two globs", function () { // eslint-disable-line max-len
            var globArray = [
                fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/whatsgoingon/test.js"),
            ]

            return read(globArray).then(function (list) {
                assert.match(list, globArray)
            })
        })

        it("returns a input stream for multiple globs + negation (globbing)", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/stuff/*.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("returns a input stream for multiple globs + negation (direct)", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/stuff/run.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("returns a file name stream with negation from a glob", function () {
            return read([
                fixture("glob-stream/**/*.js"),
                "!" + fixture("**/test.js"),
            ]).then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a file name stream from two globs and a negative", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/*.coffee"),
                fixture("glob-stream/whatsgoingon/*.coffee"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("respects the globs array order", function () {
            return read([
                fixture("glob-stream/stuff/*"),
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("ignores leading negative globs", function () {
            return read([
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        function asyncIt(desc, init) {
            it(desc, function (callback) {
                var locked = false

                function wrap(func) {
                    return function () {
                        try {
                            if (!locked) func.apply(undefined, arguments)
                            return undefined
                        } catch (e) {
                            return done(e)
                        }
                    }
                }

                function done(e) {
                    locked = true
                    return callback(e)
                }

                return init({
                    wrap: wrap,
                    done: done,
                    reject: function (e) {
                        return wrap(function () { done(e) })
                    },
                    flag: function () {
                        var cond = false

                        return {
                            set: wrap(function () { cond = true }),
                            check: wrap(function () {
                                assert.equal(cond, true)
                            }),
                            wrap: function (check) {
                                return wrap(function () {
                                    cond = true
                                    check.apply(undefined, arguments)
                                })
                            },
                            done: wrap(function () {
                                assert.equal(cond, true)
                                done()
                            }),
                        }
                    },
                })
            })
        }

        asyncIt("warns on missing positive glob", function (_) {
            var warned1 = _.flag()

            GS.create(["!c"], {
                send: _.reject(new Error("Expected no files")),
                warn: warned1.wrap(assert.isString),
                error: _.done,
                end: _.wrap(function () {
                    warned1.check()
                    var warned2 = _.flag()

                    GS.create(["!a", "!b"], {
                        send: _.reject(new Error("Expected no files")),
                        warn: warned2.wrap(assert.isString),
                        error: _.done,
                        end: warned2.done,
                    })
                }),
            })
        })

        asyncIt("warns on singular glob when file not found", function (_) {
            var warned = _.flag()

            GS.create(["notfound"], {
                send: _.reject(new Error("Expected no files")),
                warn: warned.wrap(assert.isString),
                error: _.done,
                end: warned.done,
            })
        })

        asyncIt("warns when multiple single globs not found", function (_) {
            var warned = _.flag()

            GS.create([
                "notfound",
                fixture("glob-stream/stuff/foo.js"),
            ], {
                send: _.reject(new Error("Expected no files")),
                warn: warned.wrap(assert.isString),
                error: _.done,
                end: warned.done,
            })
        })

        asyncIt("warns when missing single glob isn't alone", function (_) {
            var warned = _.flag()

            GS.create([
                "notfound",
                fixture("glob-stream/stuff/*.dmc"),
            ], {
                send: function () {},
                warn: warned.wrap(assert.isString),
                error: _.done,
                end: warned.done,
            })
        })

        it("emits no error on glob containing {} when not found", function () {
            return read(["notfound{a,b}"]).then(function (list) {
                assert.match(list, [])
            })
        })
    })
})
