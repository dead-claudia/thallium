"use strict"

const t = require("../../index.js")
const Util = require("../../test-util/base.js")

const n = Util.n
const p = Util.p

describe("core (iterators)", () => {
    function createSentinel(name) {
        return Object.assign(new Error(name), {marker() {}})
    }

    function test(last) {
        return (name, len, create) => it(name, () => {
            const sentinel = createSentinel("sentinel")
            const iter = create(sentinel)
            const tt = t.base()
            const ret = []

            const list = []
            let index = 0

            const wrapper = {}

            wrapper.next = value => {
                list.push(value)
                const ret = iter.next(index)

                if (!ret.done) index++
                return ret
            }

            if (iter.throw) wrapper.throw = value => iter.throw(value)

            tt.reporter(Util.push(ret))
            tt.async("test", () => wrapper)

            return tt.run().then(() => {
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

    const pass = test(() => n("pass", [p("test", 0)]))
    const fail = test(sentinel => n("fail", [p("test", 0)], sentinel))
    const resolve = value => ({then(resolve) { resolve(value) }})
    const reject = value => ({then(_, reject) { reject(value) }})
    const next = value => ({done: false, value})
    const done = value => ({done: true, value})
    const unreachable = () => t.fail("should never happen")
    const recover = (sentinel, f) => value => {
        t.equal(value, sentinel)
        return done(f())
    }

    function check(name, throws, m) {
        context(name, () => {
            const doFive = index =>
                index >= 5 ? done(m.return(5)) : next(m.return(index))

            pass("normal", 5, () => ({next: doFive, throw: unreachable}))
            pass("normal + no `throw`", 5, () => ({next: doFive}))

            m.nothrow(`${throws} initially`, 0, sentinel => ({
                next: () => next(m.throw(sentinel)),
                throw: recover(sentinel, m.return),
            }))

            fail(`${throws} initially + no \`throw\``, 0, sentinel => ({
                next: () => next(m.throw(sentinel)),
            }))

            const throwNext = sentinel => index => {
                if (index !== 0) return next(m.throw(sentinel))
                return next(m.return(index))
            }

            m.nothrow(`${throws} in middle`, 1, sentinel => ({
                next: throwNext(sentinel),
                throw: m.recover(sentinel, m.return),
            }))

            fail(`${throws} in middle + no \`throw\``, 1, sentinel => ({
                next: throwNext(sentinel),
            }))
        })
    }

    check("raw", "throws", {
        nothrow: fail,
        recover: () => unreachable,
        return: value => value,
        throw: value => { throw value },
    })

    check("promise", "rejects", {
        nothrow: pass,
        recover,
        return: resolve,
        throw: reject,
    })

    // This contains most of the more edge cases.
    check("mixed, return raw + reject promise", "rejects", {
        nothrow: pass,
        recover,
        return: value => value,
        throw: reject,
    })

    check("mixed, return raw + reject promise", "throws", {
        nothrow: fail,
        recover,
        return: resolve,
        throw: value => { throw value },
    })

    fail("mixed, rejects in middle + rejects in recovery", 1, sentinel => {
        const initial = createSentinel("initial")
        let returned = 0
        let called = 0

        return {
            next: index => {
                if (index !== 0) return next(reject(initial))
                return next(index)
            },
            throw(value) {
                returned++
                t.equal(value, initial)
                return done({
                    then: (_, reject) => {
                        called++
                        reject(sentinel)
                    },
                })
            },
            check() {
                t.equal(returned, 1)
                t.equal(called, 1)
            },
        }
    })
})
