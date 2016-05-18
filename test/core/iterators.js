"use strict"

var t = require("../../index.js")
var Util = require("../../test-util/base.js")

var n = Util.n
var p = Util.p

describe("core (iterators)", function () {
    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    function test(last) {
        return function (name, len, create) {
            it(name, function () {
                var sentinel = createSentinel("sentinel")
                var iter = create(sentinel)
                var tt = t.base()
                var ret = []

                var list = []
                var index = 0

                var wrapper = {}

                wrapper.next = function (value) {
                    list.push(value)
                    var ret = iter.next(index)

                    if (!ret.done) index++
                    return ret
                }

                if (iter.throw) {
                    wrapper.throw = function (value) {
                        return iter.throw(value)
                    }
                }

                tt.reporter(Util.push(ret))
                tt.async("test", function () { return wrapper })

                return tt.run().then(function () {
                    t.match(ret, [
                        n("start", []),
                        n("start", [p("test", 0)]),
                        n("end", [p("test", 0)]),
                        last(sentinel),
                        n("end", []),
                        n("exit", []),
                    ])
                    t.match(list, [undefined, 0, 1, 2, 3, 4].slice(0, len + 1))
                    if (iter.check) iter.check()
                })
            })
        }
    }

    var pass = test(function () { return n("pass", [p("test", 0)]) })
    var fail = test(function (err) { return n("fail", [p("test", 0)], err) })

    function resolve(value) {
        return {then: function (resolve) { resolve(value) }}
    }

    function reject(value) {
        return {then: function (_, reject) { reject(value) }}
    }

    function next(value) {
        return {done: false, value: value}
    }

    function done(value) {
        return {done: true, value: value}
    }

    function unreachable() {
        t.fail("should never happen")
    }

    function recover(sentinel, f) {
        return function (value) {
            t.equal(value, sentinel)
            return done(f())
        }
    }

    function check(name, throws, m) {
        context(name, function () {
            function doFive(index) {
                return index >= 5 ? done(m.return(5)) : next(m.return(index))
            }

            pass("normal", 5, function () {
                return {next: doFive, throw: unreachable}
            })

            pass("normal + no `throw`", 5, function () {
                return {next: doFive}
            })

            m.nothrow(throws + " initially", 0, function (sentinel) {
                return {
                    next: function () { return next(m.throw(sentinel)) },
                    throw: recover(sentinel, m.return),
                }
            })

            fail(throws + " initially + no `throw`", 0, function (sentinel) {
                return {next: function () { return next(m.throw(sentinel)) }}
            })

            function throwNext(sentinel) {
                return function (index) {
                    if (index !== 0) return next(m.throw(sentinel))
                    return next(m.return(index))
                }
            }

            m.nothrow(throws + " in middle", 1, function (sentinel) {
                return {
                    next: throwNext(sentinel),
                    throw: m.recover(sentinel, m.return),
                }
            })

            fail(throws + " in middle + no `throw`", 1, function (sentinel) {
                return {next: throwNext(sentinel)}
            })
        })
    }

    check("raw", "throws", {
        nothrow: fail,
        recover: function () { return unreachable },
        return: function (value) { return value },
        throw: function (value) { throw value },
    })

    check("promise", "rejects", {
        nothrow: pass,
        recover: recover,
        return: resolve,
        throw: reject,
    })

    // This contains most of the more edge cases.
    check("mixed, return raw + reject promise", "rejects", {
        nothrow: pass,
        recover: recover,
        return: function (value) { return value },
        throw: reject,
    })

    check("mixed, return raw + reject promise", "throws", {
        nothrow: fail,
        recover: recover,
        return: resolve,
        throw: function (value) { throw value },
    })

    fail("mixed, rejects in middle + rejects in recovery", 1, function (err) {
        var initial = createSentinel("initial")
        var returned = 0
        var called = 0

        return {
            next: function (index) {
                if (index !== 0) return next(reject(initial))
                return next(index)
            },
            throw: function (value) {
                returned++
                t.equal(value, initial)
                return done({
                    then: function (_, reject) {
                        called++
                        reject(err)
                    },
                })
            },
            check: function () {
                t.equal(returned, 1)
                t.equal(called, 1)
            },
        }
    })
})
