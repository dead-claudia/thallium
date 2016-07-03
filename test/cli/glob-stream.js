"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var through2 = require("through2")
var fixture = require("../../scripts/cli.js").fixture
var GS = require("../../lib/cli/glob-stream.js")

describe("cli glob stream", function () {
    describe("addStream()", function () {
        it("throws error if stream is not readable", function () {
            var stream = through2.obj()
            var list = [{readable: false}]

            t.throwsMatch(function () {
                GS.addStream(Object.create(null), stream, list, list[0])
            }, "All input streams must be readable")
        })

        it("emits data from all streams", function (done) {
            var s1 = through2.obj()
            var s2 = through2.obj()
            var s3 = through2.obj()
            var streams = [s1, s2, s3]
            var combined = through2.obj()
            var results = []

            streams.forEach(function (stream) {
                GS.addStream(Object.create(null), combined, streams, stream)
            })

            combined.on("data", function (data) {
                results.push(data)
            })

            combined.on("end", function () {
                t.match(results, [
                    {path: "stream 1"},
                    {path: "stream 2"},
                    {path: "stream 3"},
                ])
                done()
            })

            s1.write({path: "stream 1"})
            s1.end()

            s2.write({path: "stream 2"})
            s2.end()

            s3.write({path: "stream 3"})
            s3.end()
        })

        it("emits all data event from each stream", function (done) {
            var s = through2.obj()
            var combined = through2.obj()
            var results = []

            GS.addStream(Object.create(null), combined, [s], s)

            combined.on("data", function (data) {
                results.push(data)
            })

            combined.on("end", function () {
                t.match(results, [
                    {path: "data1"},
                    {path: "data2"},
                    {path: "data3"},
                ])
                done()
            })

            s.write({path: "data1"})
            s.write({path: "data2"})
            s.write({path: "data3"})
            s.end()
        })

        it("preserves streams order", function (done) {
            function delay(ms) {
                return /** @this */ function (data, enc, next) {
                    var self = this

                    setTimeout(function () {
                        self.push(data)
                        next()
                    }, ms)
                }
            }
            var s1 = through2.obj(delay(200))
            var s2 = through2.obj(delay(30))
            var s3 = through2.obj(delay(100))
            var streams = [s1, s2, s3]
            var combined = through2.obj()
            var results = []

            streams.forEach(function (stream) {
                GS.addStream(Object.create(null), combined, streams, stream)
            })

            combined.on("data", function (data) {
                results.push(data)
            })
            combined.on("end", function () {
                t.match(results, [
                    {path: "stream 1"},
                    {path: "stream 2"},
                    {path: "stream 3"},
                ])
                done()
            })

            s1.write({path: "stream 1"})
            s1.end()

            s2.write({path: "stream 2"})
            s2.end()

            s3.write({path: "stream 3"})
            s3.end()
        })

        it("emits stream errors downstream", function (done) {
            var s1 = through2.obj(/** @this */ function (data, enc, next) {
                this.emit("error", new Error("stop"))
                next()
            })
            var s2 = through2.obj()

            var error
            var streamData = []
            var streams = [s1, s2]
            var combined = through2.obj()

            GS.addStream(Object.create(null), combined, streams, s1)
            GS.addStream(Object.create(null), combined, streams, s2)

            combined.on("data", function (data) {
                streamData.push(data)
            })
            combined.on("error", function (err) {
                error = err
            })
            combined.on("end", function () {
                t.hasOwn(error, "message", "stop")
                t.match(streamData, [{path: "okay"}])
                done()
            })

            s1.write({path: "go"})
            s1.end()
            s2.write({path: "okay"})
            s2.end()
        })
    })

    describe("create() (FLAKE)", function () { // eslint-disable-line max-statements, max-len
        var oldCwd = process.cwd()

        beforeEach(function () {
            process.chdir(__dirname)
        })

        afterEach(function () {
            process.chdir(oldCwd)
        })

        it("returns a folder name stream from a glob", function (done) {
            var stream = GS.create([fixture("glob-stream/whatsgoingon")])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/"),
                    path: fixture("glob-stream/whatsgoingon"),
                })
                done()
            })
        })

        it("returns only folder name stream from a glob", function (done) {
            var folderCount = 0
            var stream = GS.create([fixture("glob-stream/whatsgoingon/*/")])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.hasOwn(file, "path", fixture("glob-stream/whatsgoingon/hey/"))
                folderCount++
            })
            stream.on("end", function () {
                t.equal(folderCount, 1)
                done()
            })
        })

        it("returns a file name stream from a glob", function (done) {
            var stream = GS.create([fixture("glob-stream/*.coffee")])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/"),
                    path: fixture("glob-stream/test.coffee"),
                })
                done()
            })
        })

        it("returns a file name stream from a glob and respect state", function (done) { // eslint-disable-line max-len
            /** @this */
            function transform(data, enc, cb) {
                var self = this

                this.pause()
                setTimeout(function () {
                    self.push(data)
                    self.resume()
                    return cb()
                }, 500)
            }

            var stream = GS.create([fixture("glob-stream/stuff/*.dmc")])
            var wrapper = stream.pipe(through2.obj(transform))
            var count = 0

            stream.on("error", done)
            wrapper.on("data", function () {
                count++
            })
            wrapper.on("end", function () {
                t.equal(count, 2)
                done()
            })
        })

        it("returns a file name stream that does not duplicate", function (done) { // eslint-disable-line max-len
            var stream = GS.create([
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/test.coffee"),
            ])

            stream.on("error", function (err) {
                done(err)
            })
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/"),
                    path: fixture("glob-stream/test.coffee"),
                })
                done()
            })
        })

        it("returns a file name stream from a direct path", function (done) {
            var stream = GS.create([fixture("glob-stream/test.coffee")])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/"),
                    path: fixture("glob-stream/test.coffee"),
                })
                done()
            })
        })

        it("returns no files with dotfiles", function (done) {
            var stream = GS.create([fixture("glob-stream/*swag")])

            stream.on("error", done)
            stream.once("data", function () {
                t.fail("No match was expected")
            })
            stream.once("end", done)
        })

        it("returns a correctly ordered file name stream for three globs + globstars", function (done) { // eslint-disable-line max-len
            var globArray = [
                fixture("glob-stream/**/test.txt"),
                fixture("glob-stream/**/test.coffee"),
                fixture("glob-stream/**/test.js"),
            ]
            var stream = GS.create(globArray)
            var files = []

            stream.on("error", done)
            stream.on("data", function (file) {
                t.hasOwn(file, "path")
                files.push(file.path)
            })
            stream.on("end", function () {
                t.match(files, [
                    fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                    fixture("glob-stream/test.coffee"),
                    fixture("glob-stream/whatsgoingon/test.js"),
                ])
                done()
            })
        })

        it("returns a correctly ordered file name stream for two globs", function (done) { // eslint-disable-line max-len
            var globArray = [
                fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/whatsgoingon/test.js"),
            ]
            var stream = GS.create(globArray)
            var files = []

            stream.on("error", done)
            stream.on("data", function (file) {
                t.hasOwn(file, "path")
                files.push(file.path)
            })
            stream.on("end", function () {
                t.match(files, globArray)
                done()
            })
        })

        it("returns a input stream for multiple globs + negation (globbing)", function (done) { // eslint-disable-line max-len
            var expectedPath = fixture("glob-stream/stuff/run.dmc")
            var stream = GS.create([
                fixture("glob-stream/stuff/*.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ])
            var files = []

            stream.on("error", done)
            stream.on("data", function (file) {
                t.hasOwn(file, "path")
                files.push(file.path)
            })
            stream.on("end", function () {
                t.match(files, [expectedPath])
                done()
            })
        })

        it("returns a input stream for multiple globs + negation (direct)", function (done) { // eslint-disable-line max-len
            var expectedPath = fixture("glob-stream/stuff/run.dmc")
            var stream = GS.create([
                fixture("glob-stream/stuff/run.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ])
            var files = []

            stream.on("error", done)
            stream.on("data", function (file) {
                t.hasOwn(file, "path")
                files.push(file.path)
            })
            stream.on("end", function () {
                t.match(files, [expectedPath])
                done()
            })
        })

        it("returns a file name stream with negation from a glob", function (done) { // eslint-disable-line max-len
            var stream = GS.create([
                fixture("glob-stream/**/*.js"),
                "!" + fixture("**/test.js"),
            ])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.fail("Unexpected file matched: " + file.path)
            })
            stream.on("end", done)
        })

        it("returns a file name stream from two globs and a negative", function (done) { // eslint-disable-line max-len
            var stream = GS.create([
                fixture("glob-stream/*.coffee"),
                fixture("glob-stream/whatsgoingon/*.coffee"),
            ])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/"),
                    path: fixture("glob-stream/test.coffee"),
                })
                done()
            })
        })

        it("respects the globs array order", function (done) {
            var stream = GS.create([
                fixture("glob-stream/stuff/*"),
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/stuff/"),
                    path: fixture("glob-stream/stuff/run.dmc"),
                })
                done()
            })
        })

        it("ignores leading negative globs", function (done) {
            var stream = GS.create([
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ])

            stream.on("error", done)
            stream.on("data", function (file) {
                t.match(file, {
                    cwd: __dirname,
                    base: fixture("glob-stream/stuff/"),
                    path: fixture("glob-stream/stuff/run.dmc"),
                })
                done()
            })
        })

        it("throws on invalid glob argument", function () {
            t.throwsMatch(function () {
                GS.create([42])
            }, /Invalid glob .* 0/)

            t.throwsMatch(function () {
                GS.create([".", 42])
            }, /Invalid glob .* 1/)
        })

        it("throws on missing positive glob", function () {
            t.throwsMatch(function () {
                GS.create(["!c"])
            }, /Missing positive glob/)

            t.throwsMatch(function () {
                GS.create(["!a", "!b"])
            }, /Missing positive glob/)
        })

        it("warns on singular glob when file not found", function (done) {
            var stream = GS.create(["notfound"])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                t.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("warns when multiple globs not found", function (done) {
            var stream = GS.create([
                "notfound",
                fixture("glob-stream/stuff/foo.js"),
            ])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                t.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("warns when one of many globs is not found", function (done) {
            var stream = GS.create([
                "notfound",
                fixture("glob-stream/stuff/*.dmc"),
            ])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                t.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("emits no error on glob containing {} when not found", function (done) { // eslint-disable-line max-len
            var stream = GS.create(["notfound{a,b}"])

            stream.on("error", done)

            stream.resume()
            stream.once("end", done)
        })
    })
})
