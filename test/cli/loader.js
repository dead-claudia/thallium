"use strict"

var path = require("path")
var interpret = require("interpret")
var Loader = require("../../lib/cli/loader")
var Cli = require("../../test-util/cli/cli")

var hasOwn = Object.prototype.hasOwnProperty

describe("cli/loader", function () {
    describe("keysToRegExp()", function () { // eslint-disable-line max-statements, max-len
        it("exists", function () {
            assert.isFunction(Loader.keysToRegExp)
        })

        function makeRegExp(items) {
            var object = Object.create(null)

            items.forEach(function (key) { object[key] = true })
            return Loader.keysToRegExp(object)
        }

        function makeFor(items) {
            return items.length
                ? " for " + items
                    .map(function (item) { return "`" + item + "`" })
                    .join(" + ")
                : " for nothing"
        }

        function testFails(desc, items, target) {
            desc += makeFor(items)

            it("fails " + desc, function () {
                assert.notOk(makeRegExp(items).test(target))
            })
        }

        function testPasses(desc, items, target) {
            desc += makeFor(items)

            it("passes " + desc, function () {
                assert.ok(makeRegExp(items).test(target))
            })
        }

        var empty = []

        testFails("an empty string", empty, "")
        testFails("a single dot", empty, ".")
        testFails("`.js`", empty, ".js")
        testFails("`foo.js`", empty, "foo.js")
        testFails("`foo`", empty, "foo")
        testFails("`foo.`", empty, "foo.")
        testFails("`foo.node`", empty, "foo.node")
        testFails("`foo.what`", empty, "foo.what")

        var jsOnly = [".js"]

        testFails("an empty string", jsOnly, "")
        testFails("a single dot", jsOnly, ".")
        testFails("`.js`", jsOnly, ".js")
        testPasses("`foo.js`", jsOnly, "foo.js")
        testFails("`foo`", jsOnly, "foo")
        testFails("`foo.`", jsOnly, "foo.")
        testFails("`foo.node`", jsOnly, "foo.node")
        testFails("`foo.what`", jsOnly, "foo.what")

        var jsNode = [".js", ".node"]

        testFails("an empty string", jsNode, "")
        testFails("a single dot", jsNode, ".")
        testFails("`.js`", jsNode, ".js")
        testFails("`.node`", jsNode, ".node")
        testPasses("`foo.js`", jsNode, "foo.js")
        testFails("`foo`", jsNode, "foo")
        testFails("`foo.`", jsNode, "foo.")
        testPasses("`foo.node`", jsNode, "foo.node")
        testFails("`foo.what`", jsNode, "foo.what")

        var many = [".js", ".node", ".coffee", ".babel.js", ".nope.md"]

        testFails("an empty string", many, "")
        testFails("a single dot", many, ".")
        testFails("`.js`", many, ".js")
        testFails("`.node`", many, ".node")
        testPasses("`foo.js`", many, "foo.js")
        testFails("`foo`", many, "foo")
        testFails("`foo.`", many, "foo.")
        testPasses("`foo.node`", many, "foo.node")
        testPasses("`foo.coffee`", many, "foo.coffee")
        testPasses("`foo.babel.js`", many, "foo.babel.js")
        testPasses("`foo.nope.md`", many, "foo.nope.md")
        testPasses("`babel.js`", many, "babel.js")
        testPasses("`.babel.js`", many, ".babel.js")
        testFails("`nope.md`", many, "nope.md")
        testFails("`.nope.md`", many, ".nope.md")
        testFails("`foo.what`", many, "foo.what")
    })

    /**
     * This accepts an optional `f` implementation, and it returns a function
     * with two extra properties:
     *
     * - `called` - the number of times this function has been called.
     * - `calls` - an array of `this` + `args` objects, representing each call.
     */
    function makeSpy(f) {
        /** @this */
        function spy() {
            var args = []

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            spy.called++
            spy.this.push(this)
            spy.args.push(args)

            if (f != null) return f.apply(undefined, arguments)
            else return undefined
        }

        spy.called = 0
        spy.this = []
        spy.args = []
        return spy
    }

    describe("makeSimple()", function () {
        it("exists", function () {
            assert.isFunction(Loader.makeSimple)
        })

        it("loads a normal module", function () {
            var spy = makeSpy()
            var util = Cli.mock({
                test: {
                    "config.js": spy,
                },
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy.called, 1)
                assert.match(spy.args[0], [])
            })
        })

        it("loads a thenable-exporting module", function () {
            var spy1 = makeSpy(function (resolve) { resolve() })
            var spy2 = makeSpy(function () { return {then: spy1} })
            var util = Cli.mock({
                test: {"config.js": spy2},
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy1.called, 1)
                assert.equal(spy1.args[0].length, 2)
                assert.equal(spy2.called, 1)
                assert.match(spy2.args[0], [])
            })
        })

        it("loads a default-exporting module", function () {
            var spy = makeSpy(function () { return {default: {}} })
            var util = Cli.mock({
                test: {
                    "config.js": spy,
                },
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy.called, 1)
                assert.match(spy.args[0], [])
            })
        })

        it("loads a default-exporting, thenable-exporting module", function () {
            var spy1 = makeSpy(function (resolve) { resolve() })
            var spy2 = makeSpy(function () { return {default: {then: spy1}} })
            var util = Cli.mock({
                test: {
                    "config.js": spy2,
                },
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy1.called, 1)
                assert.equal(spy1.args[0].length, 2)
                assert.equal(spy2.called, 1)
                assert.match(spy2.args[0], [])
            })
        })

        it("doesn't resolve a `default` property on an export", function () {
            var spy1 = makeSpy(function (resolve) { resolve() })
            var spy2 = makeSpy(function (resolve) { resolve({default: spy1}) })
            var spy3 = makeSpy(function () { return {then: spy2} })
            var util = Cli.mock({
                test: {"config.js": spy3},
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy1.called, 0)
                assert.equal(spy2.called, 1)
                assert.equal(spy2.args[0].length, 2)
                assert.equal(spy3.called, 1)
                assert.match(spy3.args[0], [])
            })
        })

        it("doesn't resolve a `default` property on a thenable export", function () { // eslint-disable-line max-len
            var spy1 = makeSpy(function (resolve) { resolve() })
            var spy2 = makeSpy(function (resolve) { resolve({default: spy1}) })
            var spy3 = makeSpy(function () { return {default: {then: spy2}} })
            var util = Cli.mock({
                test: {"config.js": spy3},
            })

            var loader = Loader.makeSimple({util: util}, util.cwd(),
                "./test/config.js")

            return Loader.load(loader).then(function () {
                assert.equal(spy1.called, 0)
                assert.equal(spy2.called, 1)
                assert.equal(spy2.args[0].length, 2)
                assert.equal(spy3.called, 1)
                assert.match(spy3.args[0], [])
            })
        })
    })

    describe("makeInterpret()", function () {
        it("exists", function () {
            assert.isFunction(Loader.makeInterpret)
        })

        function throwMissing() {
            var e = new Error()

            e.code = "MODULE_NOT_FOUND"
            throw e
        }

        // Note that this tests by temporarily patching `interpret.jsVariants`,
        // which is horribly brittle. Thankfully, node-interpret doesn't use
        // getters, but patching it is easier than using a mock.

        var old = interpret.jsVariants[".js"]

        afterEach(function () {
            interpret.jsVariants[".js"] = old
        })

        it("loads a null module", function () {
            interpret.jsVariants[".js"] = null

            var spy = makeSpy()
            var loader = Loader.makeInterpret({util: {load: spy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(spy.called, 0)
            })
        })

        it("loads a module string", function () {
            interpret.jsVariants[".js"] = "module"

            var spy = makeSpy()
            var loader = Loader.makeInterpret({util: {load: spy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(spy.called, 1)
                assert.match(spy.args[0], ["module", "base"])
            })
        })

        it("loads a module object", function () {
            function sentinel() {}

            var registerSpy = makeSpy()
            var mock = interpret.jsVariants[".js"] = {
                module: "module",
                register: registerSpy,
            }
            var loaderSpy = makeSpy(function () { return sentinel })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 1)
                assert.match(loaderSpy.args[0], ["module", "base"])
                assert.equal(registerSpy.called, 1)
                assert.match(registerSpy.args[0], [sentinel])
                assert.equal(registerSpy.this[0], mock)
            })
        })

        it("loads first module in string array", function () {
            interpret.jsVariants[".js"] = ["foo", "bar"]
            var loaderSpy = makeSpy()
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 1)
                assert.match(loaderSpy.args[0], ["foo", "base"])
            })
        })

        it("loads second module in string array", function () {
            interpret.jsVariants[".js"] = ["foo", "bar"]
            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") throwMissing()
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 2)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.match(loaderSpy.args[1], ["bar", "base"])
            })
        })

        it("loads first module in object array", function () {
            function sentinel1() {}
            function sentinel2() {}

            var registerSpy1 = makeSpy()
            var registerSpy2 = makeSpy()

            interpret.jsVariants[".js"] = [{
                module: "foo",
                register: registerSpy1,
            }, {
                module: "bar",
                register: registerSpy2,
            }]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return sentinel1
                if (mod === "bar") return sentinel2
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 1)
                assert.match(loaderSpy.args[0], ["foo", "base"])
            })
        })

        it("loads second module in object array", function () {
            function sentinel() {}

            var registerSpy1 = makeSpy()
            var registerSpy2 = makeSpy()

            var mock = interpret.jsVariants[".js"] = [{
                module: "foo",
                register: registerSpy1,
            }, {
                module: "bar",
                register: registerSpy2,
            }]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return throwMissing()
                if (mod === "bar") return sentinel
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 2)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.match(loaderSpy.args[1], ["bar", "base"])
                assert.equal(registerSpy1.called, 0)
                assert.equal(registerSpy2.called, 1)
                assert.match(registerSpy2.args[0], [sentinel])
                assert.match(registerSpy2.this[0], mock[1])
            })
        })

        it("loads first module in string + object array", function () {
            function sentinel1() {}
            function sentinel2() {}

            var registerSpy = makeSpy()

            interpret.jsVariants[".js"] = ["foo", {
                module: "bar",
                register: registerSpy,
            }]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return sentinel1
                if (mod === "bar") return sentinel2
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 1)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.equal(registerSpy.called, 0)
            })
        })

        it("loads second module in string + object array", function () {
            function sentinel() {}

            var registerSpy = makeSpy()

            var mock = interpret.jsVariants[".js"] = ["foo", {
                module: "bar",
                register: registerSpy,
            }]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return throwMissing()
                if (mod === "bar") return sentinel
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 2)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.match(loaderSpy.args[1], ["bar", "base"])
                assert.equal(registerSpy.called, 1)
                assert.match(registerSpy.args[0], [sentinel])
                assert.equal(registerSpy.this[0], mock[1])
            })
        })

        it("loads first module in object + string array", function () {
            function sentinel1() {}
            function sentinel2() {}

            var registerSpy = makeSpy()

            var mock = interpret.jsVariants[".js"] = [{
                module: "foo",
                register: registerSpy,
            }, "bar"]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return sentinel1
                if (mod === "bar") return sentinel2
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 1)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.equal(registerSpy.called, 1)
                assert.match(registerSpy.args[0], [sentinel1])
                assert.equal(registerSpy.this[0], mock[0])
            })
        })

        it("loads second module in object + string array", function () {
            function sentinel() {}

            var registerSpy = makeSpy()

            interpret.jsVariants[".js"] = [{
                module: "foo",
                register: registerSpy,
            }, "bar"]

            var loaderSpy = makeSpy(function (mod) {
                if (mod === "foo") return throwMissing()
                if (mod === "bar") return sentinel
                return undefined
            })
            var loader = Loader.makeInterpret({util: {load: loaderSpy}},
                "base", ".js")

            return Loader.load(loader).then(function () {
                assert.equal(loaderSpy.called, 2)
                assert.match(loaderSpy.args[0], ["foo", "base"])
                assert.match(loaderSpy.args[1], ["bar", "base"])
                assert.equal(registerSpy.called, 0)
            })
        })
    })

    describe("initialize()", function () {
        it("exists", function () {
            assert.isFunction(Loader.initialize)
        })

        function S(mod) {
            this.mod = mod
        }

        function I(ext) {
            this.ext = ext
        }

        function D() {
            this.type = "default"
        }

        function finder(name, opts) {
            it(name, function () {
                if (!hasOwn.call(opts, "tree")) {
                    throw new TypeError("opts.tree is required")
                }

                if (!hasOwn.call(opts, "args")) {
                    throw new TypeError("opts.args is required")
                }

                if (!hasOwn.call(opts, "globs")) {
                    throw new TypeError("opts.globs is required")
                }

                if (!hasOwn.call(opts, "modules")) {
                    throw new TypeError("opts.modules is required")
                }

                var mock = Cli.mock(opts.tree)
                var loader = new Cli.Loader(opts.args, mock)

                if (opts.config != null) {
                    opts.config = loader.state.util.resolve(opts.config)
                }

                for (var i = 0; i < opts.globs.length; i++) {
                    var glob = opts.globs[i]
                    var negate = glob[0] === "!"

                    if (negate) glob = glob.slice(1)
                    glob = loader.state.util.resolve(glob)
                    opts.globs[i] = (negate ? "!" : "") + glob
                }

                opts.modules.forEach(function (mod) {
                    if (mod instanceof S) {
                        mod.mod = loader.state.util.resolve(mod.mod)
                    }
                })

                if (loader.state.args.cwd != null) {
                    mock.chdir(loader.state.args.cwd)
                }

                var modules = []

                return Loader.initialize(loader.state, function (mod) {
                    if (!(mod.mask & Loader.Mask.Internal)) {
                        modules.push(new S(mod.mod))
                    } else if (!(mod.mask & Loader.Mask.Config)) {
                        modules.push(new I(mod.ext))
                    } else {
                        modules.push(new D())
                    }

                    if (opts.load != null && opts.load.indexOf(mod) !== -1) {
                        return Loader.load(mod)
                    } else {
                        return undefined
                    }
                })
                .then(function (globs) {
                    assert.match({globs: globs, modules: modules}, {
                        globs: opts.globs,
                        modules: opts.modules,
                    })
                })
            })
        }

        // The mock resolves in a platform-specific manner. This also assumes
        // Unix-style paths.
        function abs(file) {
            if (process.platorm === "win32") file = "C:" + file
            return path.resolve(file)
        }

        /* eslint-disable max-len */

        context("default path", function () {
            finder("when it's JS", {
                tree: {
                    test: {".tl.js": "contents"},
                },
                args: "",
                globs: ["test/**/*.js", "test.js"],
                modules: [new S("test/.tl.js")],
            })

            finder("when it's CoffeeScript", {
                tree: {
                    test: {".tl.coffee": "contents"},
                },
                args: "",
                globs: ["test/**/*.coffee", "test.coffee"],
                modules: [
                    new I(".coffee"),
                    new S("test/.tl.coffee"),
                ],
            })

            finder("when it's Babel + JS", {
                tree: {
                    test: {".tl.babel.js": "contents"},
                },
                args: "",
                globs: ["test/**/*.babel.js", "test.babel.js"],
                modules: [
                    new I(".babel.js"),
                    new S("test/.tl.babel.js"),
                ],
            })

            finder("when it's literate CoffeeScript", {
                tree: {
                    test: {".tl.coffee.md": "contents"},
                },
                args: "",
                globs: ["test/**/*.coffee.md", "test.coffee.md"],
                modules: [
                    new I(".coffee.md"),
                    new S("test/.tl.coffee.md"),
                ],
            })
        })

        context("no config", function () {
            finder("returns default when none exists", {
                tree: {
                    test: {"nope.js": ""},
                },
                args: "",
                globs: ["test/**/*.js", "test.js"],
                modules: [new D()],
            })

            finder("returns default when non-executable extension exists", {
                tree: {
                    test: {".tl.json": "contents"},
                },
                args: "",
                globs: ["test/**/*.js", "test.js"],
                modules: [new D()],
            })

            finder("returns default when a directory", {
                tree: {
                    test: {".tl.js": {}},
                },
                args: "",
                globs: ["test/**/*.js", "test.js"],
                modules: [new D()],
            })
        })

        context("--config", function () {
            finder("gets a specific config", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.js": "contents"},
                },
                args: "--config other/foo.js",
                globs: ["test/**/*.js", "test.js"],
                modules: [new S("other/foo.js")],
            })

            finder("gets a specific config that doesn't exist", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.js": "contents"},
                },
                args: "--config other/what.js",
                globs: ["test/**/*.js", "test.js"],
                modules: [new S("other/what.js")],
            })

            finder("gets a config with an unknown extension", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.config": "contents"},
                },
                args: "--config other/foo.config",
                globs: ["test/**/*.js", "test.js"],
                modules: [new S("other/foo.config")],
            })
        })

        context("from globs", function () {
            finder("when in a single file glob", {
                tree: {
                    src: {".tl.coffee": "contents"},
                },
                args: "src/**/*.test.coffee",
                globs: ["src/**/*.test.coffee"],
                modules: [
                    new I(".coffee"),
                    new S("src/.tl.coffee"),
                ],
            })

            finder("when in the first of many file globs", {
                tree: {
                    src1: {".tl.coffee": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".coffee"),
                    new I(".ls"),
                    new I(".litcoffee"),
                    new S("src1/.tl.coffee"),
                ],
            })

            finder("when in the middle of many file globs", {
                tree: {
                    src2: {".tl.ls": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".ls"),
                    new I(".coffee"),
                    new I(".litcoffee"),
                    new S("src2/.tl.ls"),
                ],
            })

            finder("when in the last of many file globs", {
                tree: {
                    src3: {".tl.litcoffee": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".litcoffee"),
                    new I(".coffee"),
                    new I(".ls"),
                    new S("src3/.tl.litcoffee"),
                ],
            })

            finder("when specified in wrong previous glob", {
                tree: {
                    src1: {".tl.ls": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".coffee"),
                    new I(".ls"),
                    new I(".litcoffee"),
                    new D(),
                ],
            })

            finder("when specified in wrong later glob", {
                tree: {
                    src3: {".tl.ls": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".coffee"),
                    new I(".ls"),
                    new I(".litcoffee"),
                    new D(),
                ],
            })

            finder("when specified in negated glob", {
                tree: {
                    src2: {".tl.ls": "contents"},
                },
                args: [
                    "src1/**/*.test.coffee",
                    "!src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                globs: [
                    "src1/**/*.test.coffee",
                    "!src2/**/*.test.ls",
                    "src3/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".coffee"),
                    new I(".litcoffee"),
                    new D(),
                ],
            })

            finder("when none satisfy any glob's ext, but a JS file exists", {
                tree: {
                    src: {".tl.js": "contents"},
                },
                args: [
                    "src/**/*.test.coffee",
                    "src/**/*.test.ls",
                    "src/**/*.test.litcoffee",
                ],
                globs: [
                    "src/**/*.test.coffee",
                    "src/**/*.test.ls",
                    "src/**/*.test.litcoffee",
                ],
                modules: [
                    new I(".coffee"),
                    new I(".ls"),
                    new I(".litcoffee"),
                    new S("src/.tl.js"),
                ],
            })

            finder("when no glob has any ext, but a JS file exists", {
                tree: {
                    test1: {".tl.js": "contents"},
                },
                args: "test1/** test2/** test3/**",
                globs: ["test1/**/*.js", "test2/**/*.js", "test3/**/*.js"],
                modules: [new S("test1/.tl.js")],
            })

            finder("when no glob has any ext, but a CoffeeScript file exists", {
                tree: {
                    test1: {".tl.coffee": "contents"},
                },
                args: "test1/** test2/** test3/**",
                globs: [
                    "test1/**/*.coffee",
                    "test2/**/*.coffee",
                    "test3/**/*.coffee",
                ],
                modules: [
                    new I(".coffee"),
                    new S("test1/.tl.coffee"),
                ],
            })

            finder("when no glob has any ext, but a Babel + JS file exists", {
                tree: {
                    test1: {".tl.babel.js": "contents"},
                },
                args: "test1/** test2/** test3/**",
                globs: [
                    "test1/**/*.babel.js",
                    "test2/**/*.babel.js",
                    "test3/**/*.babel.js",
                ],
                modules: [
                    new I(".babel.js"),
                    new S("test1/.tl.babel.js"),
                ],
            })
        })

        context("recursion", function () {
            finder("when up a level", {
                tree: {
                    "test": {"test.js": "contents"},
                    ".tl.js": "contents",
                },
                args: "",
                globs: ["test/**/*.js", "test.js"],
                modules: [new S(".tl.js")],
            })

            finder("when at the root with a deep glob", {
                tree: {
                    "test": {
                        util: {
                            helpers: {"test.js": "contents"},
                        },
                    },
                    ".tl.js": "contents",
                },
                args: "test/util/scripts/**",
                globs: ["test/util/scripts/**/*.js"],
                modules: [new S(".tl.js")],
            })

            finder("when up a level in the middle", {
                tree: {
                    test: {
                        "helpers": {"test.js": "contents"},
                        ".tl.js": "contents",
                    },
                },
                args: "test/scripts/**",
                globs: ["test/scripts/**/*.js"],
                modules: [new S("test/.tl.js")],
            })

            finder("when in the middle with a deep glob", {
                tree: {
                    test: {
                        "util": {
                            helpers: {"test.js": "contents"},
                        },
                        ".tl.js": "contents",
                    },
                },
                args: "test/util/scripts/**",
                globs: ["test/util/scripts/**/*.js"],
                modules: [new S("test/.tl.js")],
            })
        })

        context("precedence", function () {
            finder("prefers the first glob over others", {
                tree: {
                    test1: {".tl.js": "contents"},
                    test2: {".tl.js": "contents"},
                    test3: {".tl.js": "contents"},
                },
                args: "test1/** test2/** test3/**",
                globs: ["test1/**/*.js", "test2/**/*.js", "test3/**/*.js"],
                modules: [new S("test1/.tl.js")],
            })

            finder("prefers --config to globs", {
                tree: {
                    test1: {".tl.js": "contents"},
                    test2: {".tl.js": "contents"},
                    test3: {".tl.js": "contents"},
                },
                args: "--config foo.js test1/** test2/** test3/**",
                globs: ["test1/**/*.js", "test2/**/*.js", "test3/**/*.js"],
                modules: [new S("foo.js")],
            })

            finder("prefers --config to JS", {
                tree: {
                    test: {
                        ".tl.coffee": "contents",
                        ".tl.js": "contents",
                    },
                },
                args: "--config test/.tl.coffee",
                globs: ["test/**/*.coffee", "test.coffee"],
                modules: [
                    new I(".coffee"),
                    new S("test/.tl.coffee"),
                ],
            })

            finder("prefers JS to glob", {
                tree: {
                    test: {
                        ".tl.coffee": "contents",
                        ".tl.js": "contents",
                    },
                },
                args: "test/**/*.coffee",
                globs: ["test/**/*.coffee"],
                modules: [
                    new I(".coffee"),
                    new S("test/.tl.js"),
                ],
            })
        })

        context("with different cwd", function () {
            finder("works with glob + ext", {
                tree: {
                    module: {
                        mytest: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    mytest: {
                        ".tl.coffee": "contents",
                        "foo.coffee": "contents",
                        "bar.coffee": "contents",
                    },
                },
                args: "--cwd module mytest/**/*.js",
                globs: ["module/mytest/**/*.js"],
                modules: [new S("module/mytest/.tl.js")],
            })

            finder("works with glob + no ext", {
                tree: {
                    module: {
                        mytest: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    mytest: {
                        ".tl.coffee": "contents",
                        "foo.coffee": "contents",
                        "bar.coffee": "contents",
                    },
                },
                args: "--cwd module mytest/**",
                globs: ["module/mytest/**/*.js"],
                modules: [new S("module/mytest/.tl.js")],
            })

            finder("works with default", {
                tree: {
                    module: {
                        test: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    test: {
                        ".tl.coffee": "contents",
                        "foo.coffee": "contents",
                        "bar.coffee": "contents",
                    },
                },
                args: "--cwd module",
                globs: ["module/test/**/*.js", "module/test.js"],
                modules: [new S("module/test/.tl.js")],
            })

            finder("works with --cwd test", {
                tree: {
                    module: {
                        test: {
                            "test": {
                                ".tl.js": "contents",
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                            ".tl.babel.js": "contents",
                            "foo.babel.js": "contents",
                            "bar.babel.js": "contents",
                        },
                    },
                    test: {
                        ".tl.coffee": "contents",
                        "foo.coffee": "contents",
                        "bar.coffee": "contents",
                    },
                },
                args: "--cwd module/test",
                globs: ["module/test/test/**/*.js", "module/test/test.js"],
                modules: [new S("module/test/test/.tl.js")],
            })

            finder("works with very deep cwd", {
                tree: {
                    module: {
                        foo: {
                            bar: {
                                test: {
                                    ".tl.js": "contents",
                                    "foo.js": "contents",
                                    "bar.js": "contents",
                                },
                            },
                            test: {
                                ".tl.babel.js": "contents",
                                "foo.babel.js": "contents",
                                "bar.babel.js": "contents",
                            },
                        },
                        test: {
                            ".tl.ls": "contents",
                            "foo.ls": "contents",
                            "bar.ls": "contents",
                        },
                    },
                    test: {
                        ".tl.coffee": "contents",
                        "foo.coffee": "contents",
                        "bar.coffee": "contents",
                    },
                },
                args: "--cwd module/foo/bar",
                globs: [
                    "module/foo/bar/test/**/*.js",
                    "module/foo/bar/test.js",
                ],
                modules: [new S("module/foo/bar/test/.tl.js")],
            })

            finder("honors relative --config", {
                tree: {
                    module: {
                        test: {
                            ".tl-config.js": "contents",
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                },
                args: "--cwd module --config test/.tl-config.js",
                globs: ["module/test/**/*.js", "module/test.js"],
                modules: [new S("module/test/.tl-config.js")],
            })

            finder("honors absolute --config", {
                tree: {
                    module: {
                        other: {
                            test: {
                                ".tl-config.js": "contents",
                                ".tl.js": "contents",
                            },
                        },
                        test: {
                            ".tl-config.js": "contents",
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    other: {
                        test: {
                            ".tl-config.js": "contents",
                            ".tl.js": "contents",
                        },
                    },
                },
                args: [
                    "--cwd", "module",
                    "--config", abs("/other/test/.tl-config.js"),
                ],
                globs: ["module/test/**/*.js", "module/test.js"],
                modules: [new S("other/test/.tl-config.js")],
            })

            finder("honors absolute globs", {
                tree: {
                    module: {
                        other: {
                            test: {
                                ".tl.js": "contents",
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                        },
                        test: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    other: {
                        test: {
                            ".tl.js": "contents",
                        },
                    },
                },
                args: ["--cwd", "module", abs("/other/test/**")],
                globs: ["other/test/**/*.js"],
                modules: [new S("other/test/.tl.js")],
            })

            finder("recursively searches with absolute globs", {
                tree: {
                    "module": {
                        other: {
                            test: {
                                ".tl.js": "contents",
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                        },
                        test: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    ".tl.js": "contents",
                    "other": {
                        test: {
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                },
                args: ["--cwd", "module", abs("/other/test/**")],
                globs: ["other/test/**/*.js"],
                modules: [new S(".tl.js")],
            })

            finder("recursively searches with relative globs", {
                tree: {
                    module: {
                        "other": {
                            test: {
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                        },
                        ".tl.js": "contents",
                    },
                },
                args: ["--cwd", "module", abs("/module/other/test/**")],
                globs: ["module/other/test/**/*.js"],
                modules: [new S("module/.tl.js")],
            })

            finder("recursively searches above cwd with absolute globs", {
                tree: {
                    "module": {
                        other: {
                            test: {
                                ".tl.js": "contents",
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                        },
                        test: {
                            ".tl.js": "contents",
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                    ".tl.js": "contents",
                    "other": {
                        test: {
                            "foo.js": "contents",
                            "bar.js": "contents",
                        },
                    },
                },
                args: ["--cwd", "module/other", abs("/other/test/**")],
                globs: ["other/test/**/*.js"],
                modules: [new S(".tl.js")],
            })

            finder("recursively searches above cwd with relative globs", {
                tree: {
                    "module": {
                        other: {
                            test: {
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                        },
                    },
                    ".tl.js": "contents",
                },
                args: ["--cwd", "module/other", abs("/module/other/test/**")],
                globs: ["module/other/test/**/*.js"],
                modules: [new S(".tl.js")],
            })
        })

        context("with --require", function () {
            finder("finds relative modules", {
                tree: {
                    module: {
                        "other": {
                            "test": {
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                            ".tl.js": "contents",
                        },
                        "hook.js": "contents",
                    },
                },
                args: "--cwd module --require ./hook.js other/test/**",
                globs: ["module/other/test/**/*.js"],
                modules: [
                    new S("module/hook.js"),
                    new S("module/other/.tl.js"),
                ],
            })

            finder("finds absolute modules", {
                tree: {
                    module: {
                        "other": {
                            "test": {
                                "foo.js": "contents",
                                "bar.js": "contents",
                            },
                            ".tl.js": "contents",
                        },
                        "hook.js": "contents",
                    },
                },
                args: [
                    "--cwd", "module",
                    "--require", abs("/module/hook.js"),
                    "other/test/**",
                ],
                globs: ["module/other/test/**/*.js"],
                modules: [
                    new S("module/hook.js"),
                    new S("module/other/.tl.js"),
                ],
            })
        })

        context.skip("with `files` option", function () {
            // TODO
        })

        /* eslint-enable max-len */
    })
})
