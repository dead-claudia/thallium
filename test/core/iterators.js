"use strict"

var t = require("../../index.js")
var createBase = require("../../lib/core.js")
var util = require("../../test-util/base.js")
var n = util.n

suite("core (iterators)", function () {
    suite("raw", function () {
        test("normal", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + `return`", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("normal + no `throw` + `return`", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("throws initially", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    throw sentinel
                },
                throw: function () {
                    t.fail("should never happen")
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("throws initially + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("`return` + throw initially", function (done) {
            var returned = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    throw sentinel
                },
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 0)
            }))
        })

        test("no `throw` + `return` + throw initially", function (done) {
            var returned = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    throw sentinel
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 0)
            }))
        })

        test("throws in middle", function (done) {
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
                throw: function () {
                    t.fail("should never happen")
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("throws in middle + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("`return` + throw in middle", function (done) {
            var returned = 0
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
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
            }))
        })

        test("no `throw` + `return` + throw in middle", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
            }))
        })

        test("throw in `return`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                return: function () {
                    throw sentinel
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("throw in `return` + no `throw`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                return: function () {
                    throw sentinel
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("throw in middle + throw in `return`", function (done) {
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
            sentinel2.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel1
                    }
                },
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    throw sentinel2
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("throw in middle + throw in `return` + no `throw`", function (done) { // eslint-disable-line max-len
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
            sentinel2.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel1
                    }
                },
                return: function () {
                    throw sentinel2
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })
    })

    suite("promise", function () {
        function resolve(value) {
            return {
                then: function (resolve) {
                    return resolve(value)
                },
            }
        }

        function reject(value) {
            return {
                then: function (resolve, reject) {
                    return reject(value)
                },
            }
        }

        test("normal", function (done) {
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
                throw: function () {
                    t.fail("should never happen")
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + `return`", function (done) {
            var returned = 0
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
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("normal + `return` + no `throw`", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("rejects initially", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("rejects initially + no `throw`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("`return` + throw initially", function (done) {
            var returned = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
            }))
        })

        test("`return` + no `throw` + throw initially", function (done) {
            var returned = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
            }))
        })

        test("rejects in middle", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("rejects in middle + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("`return` + reject in middle", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
            }))
        })

        test("no `throw` + `return` + reject in middle", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
            }))
        })

        test("throw in `return`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                return: function () {
                    return {done: true, value: reject(sentinel)}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("throw in `return` + no `throw`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                return: function () {
                    return {done: true, value: reject(sentinel)}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("reject in middle + throw in `return`", function (done) {
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    t.equal(value, sentinel1)
                    return {done: true}
                },
                return: function () {
                    return {done: true, value: reject(sentinel2)}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("reject in middle + throw in `return` + no `throw`", function (done) { // eslint-disable-line max-len
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                return: function () {
                    return {done: true, value: reject(sentinel2)}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })
    })

    // This contains most of the more edge cases.
    suite("mixed", function () { // eslint-disable-line max-statements
        function resolve(value) {
            return {
                then: function (resolve) {
                    return resolve(value)
                },
            }
        }

        function reject(value) {
            return {
                then: function (resolve, reject) {
                    return reject(value)
                },
            }
        }

        test("normal", function (done) {
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
                throw: function () {
                    t.fail("should never happen")
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("normal + `return`", function (done) {
            var returned = 0
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("normal + `return` + no `throw`", function (done) {
            var returned = 0
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
                t.equal(returned, 1)
            }))
        })

        test("rejects initially, but returns promise", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true, value: resolve()}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("rejects initially + no `throw`", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
            }))
        })

        test("`return` + throw initially, recovers promise", function (done) {
            var returned = 0
            var called = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called++
                                resolve()
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` + throw initially, recovers rejected promise", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
            sentinel2.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel1),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called++
                                reject(sentinel2)
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` + throw initially, returns promise", function (done) {
            var returned = 0
            var called = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called++
                                resolve()
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` + throw initially, returns rejected promise", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
            sentinel2.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel1),
                    }
                },
                throw: function (value) {
                    t.equal(value, sentinel1)
                    return {done: true}
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called++
                                reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` thenable + no `throw` + throw initially", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called++
                                resolve()
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` rejected thenable + no `throw` + throw initially", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
            sentinel2.marker = function () {}
            var iter = {
                list: [],
                index: 0,
                next: function (value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel1),
                    }
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called++
                                reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("rejects in middle", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("rejects in middle, recovers rejected thenable", function (done) {
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                            then: function (resolve, reject) {
                                called++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])

                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("rejects in middle + no `throw`", function (done) {
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

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("`return` + reject in middle", function (done) {
            var returned = 0
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
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
            }))
        })

        test("`return` + reject in middle, resolved `throw`", function (done) {
            var returned = 0
            var called = 0
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
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called++
                                return resolve()
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("`return` + reject in middle, rejected `throw`", function (done) {
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {done: true}
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("rejected `return` + reject in middle, resolved `throw`", function (done) { // eslint-disable-line max-len
            var thrown = 0
            var returned = 0
            var called1 = 0
            var called2 = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    thrown++
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called1++
                                return resolve()
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called2++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(thrown, 1)
                t.equal(returned, 1)
                t.equal(called1, 1)
                t.equal(called2, 1)
            }))
        })

        test("rejected `return` + reject in middle, rejected `throw`", function (done) { // eslint-disable-line max-len
            var thrown = 0
            var returned = 0
            var called1 = 0
            var called2 = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    thrown++
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called1++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called2++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(thrown, 1)
                t.equal(returned, 1)
                t.equal(called1, 1)
                t.equal(called2, 1)
            }))
        })

        test("rejected `return` + throw in middle, rejected `throw`", function (done) { // eslint-disable-line max-len
            var thrown = 0
            var returned = 0
            var called2 = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    thrown++
                    t.equal(value, sentinel1)
                    throw sentinel2
                },
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called2++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(thrown, 1)
                t.equal(returned, 1)
                t.equal(called2, 1)
            }))
        })

        test("no `throw` + resolved `return` + reject in middle", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
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
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve) {
                                called++
                                return resolve()
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("no `throw` + rejected `return` + reject in middle", function (done) { // eslint-disable-line max-len
            var returned = 0
            var called = 0
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                return: function () {
                    returned++
                    return {
                        done: true,
                        value: {
                            then: function (resolve, reject) {
                                called++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
                t.equal(returned, 1)
                t.equal(called, 1)
            }))
        })

        test("throw in `return` + resolved thenable", function (done) {
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                throw: function () {
                    t.fail("should never happen")
                },
                return: function () {
                    throw sentinel
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("throw in `return` + no `throw` + resolved thenable", function (done) { // eslint-disable-line max-len
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}
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
                return: function () {
                    throw sentinel
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0, 1, 2, 3, 4])
            }))
        })

        test("reject in middle + throw in `return`", function (done) {
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                    t.equal(value, sentinel1)
                    return {done: true}
                },
                return: function () {
                    throw sentinel2
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel2),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })

        test("reject in middle + throw in `return` + no `throw`", function (done) { // eslint-disable-line max-len
            var sentinel1 = new Error("sentinel1")
            sentinel1.marker = function () {}
            var sentinel2 = new Error("sentinel2")
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
                return: function () {
                    throw sentinel2
                },
            }

            var tt = createBase()
            var ret = []

            tt.reporter(util.push(ret))
            tt.async("test", function () {
                return iter
            })

            tt.run(util.wrap(done, function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("fail", "test", 0, undefined, sentinel1),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])

                t.deepEqual(iter.list, [undefined, 0])
            }))
        })
    })
})
