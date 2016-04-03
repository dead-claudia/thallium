"use strict"

var t = require("../../lib/index.js").t
var util = require("../../test-util/base.js")

var n = util.n
var p = util.p

describe("core (iterators)", function () {
    describe("raw", function () {
        it("normal", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)

                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
                throw: function () {
                    t.fail("should never happen")
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("normal + no `throw`", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("throws initially + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    throw sentinel
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined])
            })
        })

        it("throws in middle", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel
                    }
                },
                throw: function () { t.fail("should never happen") },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })

        it("throws in middle + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })
    })

    describe("promise", function () {
        function resolve(value) {
            return {then: function (resolve) { resolve(value) }}
        }

        function reject(value) {
            return {then: function (_, reject) { reject(value) }}
        }

        it("normal", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
                throw: function () { t.fail("should never happen") },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("normal + no `throw`", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("rejects initially", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {done: false, value: reject(sentinel)}
                },

                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined])
            })
        })

        it("rejects initially + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {done: false, value: reject(sentinel)}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined])
            })
        })

        it("rejects in middle", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })

        it("rejects in middle + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })
    })

    // This contains most of the more edge cases.
    describe("mixed", function () {
        function resolve(value) {
            return {then: function (resolve) { resolve(value) }}
        }

        function reject(value) {
            return {then: function (_, reject) { reject(value) }}
        }

        it("normal", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
                throw: function () { t.fail("should never happen") },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("normal + no `throw`", function () {
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            })
        })

        it("rejects initially, but returns promise", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {done: false, value: reject(sentinel)}
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true, value: resolve()}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined])
            })
        })

        it("rejects initially + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {done: false, value: reject(sentinel)}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined])
            })
        })

        it("rejects in middle", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })

        it("rejects in middle, recovers rejected thenable", function () {
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            var sentinel2 = new Error("sentinel2")

            sentinel1.marker = function () {}
            sentinel2.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel1)}
                    }
                },
                throw: function (value) {
                    returned++
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then: function (_, reject) {
                                called++
                                reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel2),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])

                t.equal(returned, 1)
                t.equal(called, 1)
            })
        })

        it("rejects in middle + no `throw`", function () {
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
            }

            var tt = t.base()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () { return iter })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            })
        })
    })
})
