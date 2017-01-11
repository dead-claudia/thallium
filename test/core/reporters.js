describe("core (reporters)", function () { // eslint-disable-line max-statements
    "use strict"

    var n = Util.n
    var p = Util.p
    var hooks = Util.hooks

    // Use thenables, not actual Promises.
    function resolve(value) {
        return {then: function (resolve) { resolve(value) }}
    }

    function reject(value) {
        return {then: function (_, reject) { reject(value) }}
    }

    function identity(r) {
        return r
    }

    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    context("normal", function () {
        it("added to root correctly", function () {
            var tt = Util.create()
            var ret = []

            assert.equal(tt.hasReporter, false)
            tt.reporter(Util.push, ret)
            assert.equal(tt.hasReporter, true)

            tt.test("test 1", function () {})
            tt.test("test 2", function () {})

            return tt.run().then(function () {
                assert.match(ret, [
                    n.start(),
                    n.pass([p("test 1", 0)]),
                    n.pass([p("test 2", 1)]),
                    n.end(),
                ])
            })
        })

        it("errors if added to children", function () {
            var tt = Util.create()
            var ret = []
            var successful

            function check(tt, reporter) {
                if (successful) return
                try {
                    tt.reporter(reporter)
                    successful = true
                } catch (e) {
                    successful = false
                }
            }

            function reporter1() { return Util.const() }
            function reporter2() { return Util.const() }
            function reporter3() { return Util.const() }
            function reporter4() { return Util.const() }
            function reporter5() { return Util.const() }

            tt.reporter(Util.push, ret)

            tt.test("test", function () {
                check(tt, reporter1)
                check(tt, reporter2)
                check(tt, reporter3)
                check(tt, reporter4)
                check(tt, reporter5)
            })

            return tt.run().then(function () {
                assert.equal(successful, false)
                assert.match(ret, [
                    n.start(),
                    n.pass([p("test", 0)]),
                    n.end(),
                ])
            })
        })

        it("uses last added", function () {
            var tt = Util.create()
            var ret1 = []
            var ret2 = []
            var ret3 = []

            function reporter1() { return Util.push(ret1) }
            function reporter2() { return Util.push(ret2) }
            function reporter3() { return Util.push(ret3) }

            tt.reporter(reporter1)
            tt.reporter(reporter2)
            tt.reporter(reporter3)

            tt.reporter(reporter3)
            tt.reporter(reporter2)

            tt.test("test 1", function () {})
            tt.test("test 2", function () {})

            return tt.run().then(function () {
                assert.match(ret1, [])
                assert.match(ret2, [
                    n.start(),
                    n.pass([p("test 1", 0)]),
                    n.pass([p("test 2", 1)]),
                    n.end(),
                ])
                assert.match(ret3, [])
            })
        })
    })

    context("reflect", function () {
        function notHasReporter(tt, reporter) {
            if (tt.call(function (r) { return r.hasReporter(reporter) })) {
                assert.fail("Expected test to not have reporter {actual}", {
                    actual: reporter,
                })
            }
        }

        function hasReporter(tt, reporter) {
            if (!tt.call(function (r) { return r.hasReporter(reporter) })) {
                assert.fail("Expected test to have reporter {expected}", {
                    expected: reporter,
                })
            }
        }

        function addReporter(reflect, reporter) {
            reflect.reporter(reporter)
        }

        function removeReporter(reflect, reporter) {
            reflect.removeReporter(reporter)
        }

        it("added to root correctly", function () {
            var tt = Util.create()

            function reporter() { return Util.const() }

            tt.call(addReporter, reporter)
            hasReporter(tt, reporter)
        })

        it("errors if added to children", function () {
            var tt = Util.create()
            var successful

            function check(tt, reporter) {
                if (successful) return
                try {
                    tt.call(addReporter, reporter)
                    successful = true
                } catch (e) {
                    successful = false
                }
            }

            function reporter1() { return Util.const() }
            function reporter2() { return Util.const() }
            function reporter3() { return Util.const() }
            function reporter4() { return Util.const() }
            function reporter5() { return Util.const() }
            function reporter6() { return Util.const() }

            tt.call(addReporter, reporter6)

            tt.test("test", function () {
                check(tt, reporter1)
                check(tt, reporter2)
                check(tt, reporter3)
                check(tt, reporter4)
                check(tt, reporter5)
            })

            return tt.run().then(function () {
                assert.equal(successful, false)
                notHasReporter(tt, reporter1)
                notHasReporter(tt, reporter2)
                notHasReporter(tt, reporter3)
                notHasReporter(tt, reporter4)
                notHasReporter(tt, reporter5)
                hasReporter(tt, reporter6)
            })
        })

        it("removed individually correctly", function () {
            var tt = Util.create()

            function reporter() { return Util.const() }

            tt.call(addReporter, reporter)
            tt.call(removeReporter, reporter)
            notHasReporter(tt, reporter)
        })

        it("errors if \"removed\" from children", function () {
            var tt = Util.create()
            var successful

            function reporter1() { return Util.const() }
            function reporter2() { return Util.const() }
            function reporter3() { return Util.const() }
            function reporter4() { return Util.const() }
            function reporter5() { return Util.const() }
            function reporter6() { return Util.const() }

            function checkAdd(tt, reporter) {
                if (successful) return
                try {
                    tt.call(addReporter, reporter)
                    successful = true
                } catch (e) {
                    successful = false
                }
            }

            function checkRemove(tt, reporter) {
                if (successful) return
                try {
                    tt.call(addReporter, reporter)
                    successful = true
                } catch (e) {
                    successful = false
                }
            }

            tt.call(addReporter, reporter6)

            tt.test("test", function () {
                checkAdd(tt, reporter1)
                checkAdd(tt, reporter2)
                checkAdd(tt, reporter3)
                checkAdd(tt, reporter4)
                checkAdd(tt, reporter5)

                checkRemove(tt, reporter1)
                checkRemove(tt, reporter2)
                checkRemove(tt, reporter4)
            })

            return tt.run().then(function () {
                assert.equal(successful, false)
                notHasReporter(tt, reporter1)
                notHasReporter(tt, reporter2)
                notHasReporter(tt, reporter3)
                notHasReporter(tt, reporter4)
                notHasReporter(tt, reporter5)
                hasReporter(tt, reporter6)
            })
        })

        it("only added once", function () {
            var tt = Util.create()
            var ret1 = []
            var ret2 = []
            var ret3 = []

            function reporter1() { return Util.push(ret1) }
            function reporter2() { return Util.push(ret2) }
            function reporter3() { return Util.push(ret3) }

            tt.call(addReporter, reporter1)
            tt.call(addReporter, reporter2)
            tt.call(addReporter, reporter3)

            tt.call(addReporter, reporter3)
            tt.call(addReporter, reporter1)

            tt.test("test 1", function () {})
            tt.test("test 2", function () {})

            var expected = [
                n.start(),
                n.pass([p("test 1", 0)]),
                n.pass([p("test 2", 1)]),
                n.end(),
            ]

            return tt.run().then(function () {
                assert.match(ret1, expected)
                assert.match(ret2, expected)
                assert.match(ret3, expected)
            })
        })
    })

    it("called correctly with sync passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with sync failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ])
        })
    })

    it("called correctly with sync both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.pass([p("two", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with inline passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ])
        })
    })

    it.fixPhantom("called correctly with inline failing", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)
        tt.test("one", function () { assert.fail("fail") })
        tt.test("two", function () { assert.fail("fail") })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], new AssertionError("fail")),
                n.fail([p("two", 1)], new AssertionError("fail")),
                n.end(),
            ])
        })
    })

    it.fixPhantom("called correctly with inline both", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)
        tt.test("one", function () { assert.fail("fail") })
        tt.test("two", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], new AssertionError("fail")),
                n.pass([p("two", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with async passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () { return resolve() })
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with async failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ])
        })
    })

    it("called correctly with async both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { return resolve() })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.pass([p("two", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with async + promise passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () { return resolve() })
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with async + promise failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ])
        })
    })

    it("called correctly with async + promise both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { return resolve() })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.pass([p("two", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with child passing tests", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.test("one", function () {})
            tt.test("two", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.pass([p("test", 0), p("one", 0)]),
                n.pass([p("test", 0), p("two", 1)]),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("called correctly with child failing tests", function () {
        var tt = Util.create()
        var ret = []
        var sentinel1 = createSentinel("sentinel one")
        var sentinel2 = createSentinel("sentinel two")

        tt.reporter(Util.push, ret)

        tt.test("parent one", function () {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () { throw sentinel1 })
        })

        tt.test("parent two", function () {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () { throw sentinel2 })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("parent one", 0)]),
                n.fail([p("parent one", 0), p("child one", 0)], sentinel1),
                n.fail([p("parent one", 0), p("child two", 1)], sentinel1),
                n.leave([p("parent one", 0)]),
                n.enter([p("parent two", 1)]),
                n.fail([p("parent two", 1), p("child one", 0)], sentinel2),
                n.fail([p("parent two", 1), p("child two", 1)], sentinel2),
                n.leave([p("parent two", 1)]),
                n.end(),
            ])
        })
    })

    it("called correctly with child both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel1 = createSentinel("sentinel one")
        var sentinel2 = createSentinel("sentinel two")

        tt.reporter(Util.push, ret)

        tt.test("parent one", function () {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () {})
        })

        tt.test("parent two", function () {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("parent one", 0)]),
                n.fail([p("parent one", 0), p("child one", 0)], sentinel1),
                n.pass([p("parent one", 0), p("child two", 1)]),
                n.leave([p("parent one", 0)]),
                n.enter([p("parent two", 1)]),
                n.fail([p("parent two", 1), p("child one", 0)], sentinel2),
                n.pass([p("parent two", 1), p("child two", 1)]),
                n.leave([p("parent two", 1)]),
                n.end(),
            ])
        })
    })

    it("locks itself when running", function () {
        var tt = Util.create()
        var err

        tt.reporter(Util.const(function (report) {
            if (report.isFail) err = report.error
        }))

        tt.test("test", function () {
            tt.run()
        })

        return tt.run().then(function () {
            assert.is(Error, err)
        })
    })

    it.fixPhantom("called correctly with complex sequence", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("mod-one", function () {
            tt.test("1 === 1", function () { assert.equal(1, 1) })

            tt.test("foo()", function () {
                assert.notEqual(1, 1)
            })

            tt.test("bar()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () {
                            reject(new Error("fail"))
                        }, 0)
                    },
                }
            })

            tt.test("baz()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () { reject(sentinel) }, 0)
                    },
                }
            })

            tt.test("nested", function () {
                tt.test("nested 2", function () { assert.equal(true, true) })
            })
        })

        tt.test("mod-two", function () {
            tt.test("1 === 2", function () { assert.equal(1, 2) })
        })

        var fail = new AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("mod-one", 0)]),
                n.pass([p("mod-one", 0), p("1 === 1", 0)]),
                n.fail([p("mod-one", 0), p("foo()", 1)], fail),
                n.fail([p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n.fail([p("mod-one", 0), p("baz()", 3)], sentinel),
                n.enter([p("mod-one", 0), p("nested", 4)]),
                n.pass([p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n.leave([p("mod-one", 0), p("nested", 4)]),
                n.leave([p("mod-one", 0)]),
                n.enter([p("mod-two", 1)]),
                n.fail([p("mod-two", 1), p("1 === 2", 0)], fail2),
                n.leave([p("mod-two", 1)]),
                n.end(),
            ])
        })
    })

    it("can return a resolving thenable", function () {
        var tt = Util.create()
        var ret = []
        var push = Util.push(ret)

        tt.reporter(Util.const(function (arg) {
            return {
                then: function (resolve) {
                    resolve(push(arg))
                },
            }
        }))

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ])
        })
    })

    it("can return a rejecting thenable", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.const(function () {
            return {then: function (_, reject) { return reject(sentinel) }}
        }))

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (err) { assert.equal(err, sentinel) })
    })

    it("reports reporter errors", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")
        var reported

        tt.reporter(Util.const(function (report) {
            if (report.isError) reported = report.error
            if (report.isStart) throw sentinel
        }))

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.equal(rejected, sentinel)
                assert.equal(reported, sentinel)
            })
    })

    // This is a bit too tightly coupled to the implementation than I'd normally
    // be comfortable with...
    it("reports internal errors", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")
        var reported

        tt.reporter(Util.const(function (report) {
            if (report.isError) reported = report.error
        }))

        tt.test("test", function () {
            Object.defineProperty(tt.call(identity)._, "locked", {
                get: function () { throw sentinel },
                set: function () { throw sentinel },
            })
        })

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.equal(rejected, sentinel)
                assert.equal(reported, sentinel)
            })
    })

    it.fixPhantom("has repeatable output", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push, ret)

        tt.test("mod-one", function () {
            tt.test("1 === 1", function () { assert.equal(1, 1) })

            tt.test("foo()", function () {
                assert.notEqual(1, 1)
            })

            tt.test("bar()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () {
                            reject(new Error("fail"))
                        }, 0)
                    },
                }
            })

            tt.test("baz()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () { reject(sentinel) }, 0)
                    },
                }
            })

            tt.test("nested", function () {
                tt.test("nested 2", function () { assert.equal(true, true) })
            })
        })

        tt.test("mod-two", function () {
            tt.test("1 === 2", function () { assert.equal(1, 2) })
        })

        var fail = new AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("mod-one", 0)]),
                n.pass([p("mod-one", 0), p("1 === 1", 0)]),
                n.fail([p("mod-one", 0), p("foo()", 1)], fail),
                n.fail([p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n.fail([p("mod-one", 0), p("baz()", 3)], sentinel),
                n.enter([p("mod-one", 0), p("nested", 4)]),
                n.pass([p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n.leave([p("mod-one", 0), p("nested", 4)]),
                n.leave([p("mod-one", 0)]),
                n.enter([p("mod-two", 1)]),
                n.fail([p("mod-two", 1), p("1 === 2", 0)], fail2),
                n.leave([p("mod-two", 1)]),
                n.end(),
            ])
        })
        .then(function () {
            while (ret.length) ret.pop()
            return tt.run()
        })
        .then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("mod-one", 0)]),
                n.pass([p("mod-one", 0), p("1 === 1", 0)]),
                n.fail([p("mod-one", 0), p("foo()", 1)], fail),
                n.fail([p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n.fail([p("mod-one", 0), p("baz()", 3)], sentinel),
                n.enter([p("mod-one", 0), p("nested", 4)]),
                n.pass([p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n.leave([p("mod-one", 0), p("nested", 4)]),
                n.leave([p("mod-one", 0)]),
                n.enter([p("mod-two", 1)]),
                n.fail([p("mod-two", 1), p("1 === 2", 0)], fail2),
                n.leave([p("mod-two", 1)]),
                n.end(),
            ])
        })
    })

    it("reports global `before all` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.beforeAll(fail)
        tt.test("foo", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.hook([], [], hooks.beforeAll(fail, sentinel)),
                n.end(),
            ])
        })
    })

    it("reports global `before each` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.before(fail)
        tt.test("foo", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.hook([p("foo", 0)], [], hooks.beforeEach(fail, sentinel)),
                n.end(),
            ])
        })
    })

    it("reports global `after each` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.after(fail)
        tt.test("foo", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("foo", 0)]),
                n.hook([p("foo", 0)], [], hooks.afterEach(fail, sentinel)),
                n.end(),
            ])
        })
    })

    it("reports global `after all` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.afterAll(fail)
        tt.test("foo", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("foo", 0)]),
                n.hook([], [], hooks.afterAll(fail, sentinel)),
                n.end(),
            ])
        })
    })

    it("reports local `before all` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.test("foo", function () {
            tt.beforeAll(fail)
            tt.test("inner", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("foo", 0)]),
                n.leave([p("foo", 0)]),
                n.hook([p("foo", 0)], [p("foo", 0)],
                    hooks.beforeAll(fail, sentinel)),
                n.end(),
            ])
        })
    })

    it("reports local `before each` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.test("foo", function () {
            tt.before(fail)
            tt.test("inner", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("foo", 0)]),
                n.hook([p("foo", 0), p("inner", 0)], [p("foo", 0)],
                    hooks.beforeEach(fail, sentinel)),
                n.leave([p("foo", 0)]),
                n.end(),
            ])
        })
    })

    it("reports local `after each` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.test("foo", function () {
            tt.after(fail)
            tt.test("inner", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("foo", 0)]),
                n.pass([p("foo", 0), p("inner", 0)]),
                n.hook([p("foo", 0), p("inner", 0)], [p("foo", 0)],
                    hooks.afterEach(fail, sentinel)),
                n.leave([p("foo", 0)]),
                n.end(),
            ])
        })
    })

    it("reports local `after all` failures", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        function fail() {
            throw sentinel
        }

        tt.reporter(Util.push, ret)
        tt.test("foo", function () {
            tt.afterAll(fail)
            tt.test("inner", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("foo", 0)]),
                n.pass([p("foo", 0), p("inner", 0)]),
                n.leave([p("foo", 0)]),
                n.hook([p("foo", 0)], [p("foo", 0)],
                    hooks.afterAll(fail, sentinel)),
                n.end(),
            ])
        })
    })

    context("stack traces", function () {
        it("pretty-prints single-line errors with no stack", function () {
            var e = new Error("test")

            e.stack = e.message
            assert.match(Util.R.getStack(e), "Error: test")
        })

        it("pretty-prints multi-line errors with no stack", function () {
            var e = new Error("test\ntest")

            e.stack = e.message
            assert.match(Util.R.getStack(e), "Error: test\ntest")
        })

        it("trims the message correctly", function () {
            var e = new Error("  test\n   test")

            e.stack = e.message + "\n at Foo "
            assert.match(Util.R.getStack(e), "Error:   test\n   test\nat Foo")
        })
    })
})
