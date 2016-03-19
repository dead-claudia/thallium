import t from "../../src/index.js"
import {n, p, push} from "../../test-util/base.js"

suite("core (iterators)", () => {
    suite("raw", () => {
        test("normal", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
                throw() {
                    t.fail("should never happen")
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("normal + no `throw`", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: this.index++}
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("throws initially + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    throw sentinel
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("throws in middle", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel
                    }
                },
                throw() {
                    t.fail("should never happen")
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("throws in middle + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        throw sentinel
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

    suite("promise", () => {
        function resolve(value) {
            return {
                then(resolve) {
                    return resolve(value)
                },
            }
        }

        function reject(value) {
            return {
                then(resolve, reject) {
                    return reject(value)
                },
            }
        }

        test("normal", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
                throw() {
                    t.fail("should never happen")
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("normal + no `throw`", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: resolve(5)}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects initially", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw(value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects initially + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects in middle", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
                throw(value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects in middle + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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
    suite("mixed", () => {
        function resolve(value) {
            return {
                then(resolve) {
                    return resolve(value)
                },
            }
        }

        function reject(value) {
            return {
                then(resolve, reject) {
                    return reject(value)
                },
            }
        }

        test("normal", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
                throw() {
                    t.fail("should never happen")
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("normal + no `throw`", () => {
            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index >= 5) {
                        return {done: true, value: 5}
                    } else {
                        return {done: false, value: resolve(this.index++)}
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects initially, but returns promise", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
                throw(value) {
                    t.equal(value, sentinel)
                    return {done: true, value: resolve()}
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects initially + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    return {
                        done: false,
                        value: reject(sentinel),
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects in middle", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
                throw(value) {
                    t.equal(value, sentinel)
                    return {done: true}
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects in middle, recovers rejected thenable", () => {
            let returned = 0
            let called = 0
            const sentinel1 = new Error("sentinel1")

            sentinel1.marker = () => {}

            const sentinel2 = new Error("sentinel2")

            sentinel2.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel1)}
                    }
                },
                throw(value) {
                    returned++
                    t.equal(value, sentinel1)
                    return {
                        done: true,
                        value: {
                            then(resolve, reject) {
                                called++
                                return reject(sentinel2)
                            },
                        },
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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

        test("rejects in middle + no `throw`", () => {
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            const iter = {
                list: [],
                index: 0,
                next(value) {
                    this.list.push(value)
                    if (this.index === 0) {
                        return {done: false, value: this.index++}
                    } else {
                        return {done: false, value: reject(sentinel)}
                    }
                },
            }

            const tt = t.base()
            const ret = []

            tt.reporter(push(ret))
            tt.async("test", () => iter)

            return tt.run().then(() => {
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
