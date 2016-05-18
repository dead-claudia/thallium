"use strict"

var interpret = require("interpret")
var Promise = require("bluebird")
var t = require("../../index.js")
var methods = require("../../lib/methods.js")
var LoaderData = require("../../lib/cli/loader-data.js")
var Util = require("../../test-util/cli.js")

var hasOwn = Object.prototype.hasOwnProperty

describe("cli config loader data", function () {
    function forEachVariantExt(f) {
        for (var key in interpret.jsVariants) {
            if (hasOwn.call(interpret.jsVariants, key)) {
                f(key)
            }
        }
    }

    function forEachDataExt(f) {
        for (var key in interpret.extensions) {
            if (hasOwn.call(interpret.extensions, key) &&
                    !hasOwn.call(interpret.jsVariants, key)) {
                f(key)
            }
        }
    }

    context("isValid()", function () {
        it("exists", function () {
            t.function(LoaderData.isValid)
        })

        forEachVariantExt(function (key) {
            it("validates " + key, function () {
                t.true(LoaderData.isValid("file" + key))
                t.true(LoaderData.isValid("module/dir.wtf/file.!!!" + key))
                // Only check this for single-extension keys.
                if (!/^\..*\./.test(key)) t.false(LoaderData.isValid(key))
                // This should never be a key, as it semantically doesn't
                // represent code.
                t.false(LoaderData.isValid("file" + key + ".docx"))
            })
        })

        forEachDataExt(function (key) {
            it("fails to validate " + key, function () {
                t.false(LoaderData.isValid("file" + key))
                t.false(LoaderData.isValid("module/dir.wtf/file.!!!" + key))
                t.false(LoaderData.isValid("file" + key + ".docx"))

                // Redundant, but it works.
                t.true(LoaderData.isValid("file" + key + ".js"))
            })
        })
    })

    context("getExt()", function () {
        it("exists", function () {
            t.function(LoaderData.getExt)
        })

        forEachVariantExt(function (key) {
            it("gets " + key, function () {
                t.equal(LoaderData.getExt("file" + key), key)
                t.equal(LoaderData.getExt("module/dir.wtf/file.!!!" + key), key)
            })
        })

        it("gets exts after invalid exts", function () {
            forEachDataExt(function (key) {
                t.equal(LoaderData.getExt("file" + key + ".js"), ".js")
            })
        })
    })

    context("extractIntoMap()", function () {
        function Loader(argv) {
            var self = this

            Util.Loader.call(this, argv, {
                load: function () { self.calls++ },
                cwd: function () { return "." },
            })
            this.calls = 0
        }

        methods(Loader, Util.Loader, {
            require: function (ext, mod, use) {
                return new LoaderData.Register(ext, mod, this.load, use)
            },

            register: function (ext, use) {
                return this.require(ext, interpret.jsVariants[ext], use)
            },

            // Partially copied from the module itself. Checks and cleans the
            // map of default keys.
            clean: function (map) {
                var list = []
                var self = this

                for (var ext in map) {
                    if (hasOwn.call(map, ext)) {
                        var data = map[ext]

                        // Skip any custom or out-of-order modules.
                        if (!data.original) continue

                        if (ext === ".js") {
                            t.deepEqual(data, LoaderData.jsLoader)
                        } else {
                            var mod = interpret.jsVariants[ext]
                            var expected =
                                new LoaderData.Register(ext, mod, self.load)

                            expected.original = true
                            t.deepEqual(data, expected)
                        }

                        list.push(ext)
                    }
                }

                for (var i = 0; i < list.length; i++) {
                    delete map[list[i]]
                }

                t.equal(this.calls, 0)
                return map
            },
        })

        function load(name, opts) {
            it(name, function () {
                var loader = new Loader(opts.args)
                var map = LoaderData.extractIntoMap(loader.state)
                var list = opts.loader(loader)

                if (!Array.isArray(list)) list = [list]

                var expected = Object.create(null)

                for (var i = 0; i < list.length; i++) {
                    var l = list[i]

                    if (Array.isArray(l)) {
                        expected[l[0]] = l[1]
                    } else if (typeof l === "string") {
                        expected[l] = loader.register(l)
                    } else {
                        expected[l.ext] = loader.require(l.ext, l.mod, true)
                    }
                }

                t.match(loader.clean(map), expected)
            })
        }

        function constant(value) {
            return function () { return value }
        }

        function ignore(name, args) {
            load(name, {args: args, loader: constant([])})
        }

        it("exists", function () {
            t.function(LoaderData.extractIntoMap)
        })

        ignore("with empty arguments", "")

        context("require", function () {
            load("with custom JS hook", {
                args: "--require js:./my-custom-hook.js",
                loader: constant({
                    ext: ".js",
                    mod: "./my-custom-hook.js",
                }),
            })

            load("with custom CoffeeScript hook", {
                args: "--require coffee:coffee-script-redux/register",
                loader: constant({
                    ext: ".coffee",
                    mod: "coffee-script-redux/register",
                }),
            })

            load("with previously unknown extension", {
                args: "--require my-shell:@company/my-shell/register",
                loader: constant({
                    ext: ".my-shell",
                    mod: "@company/my-shell/register",
                }),
            })

            load("with multiple extensions", {
                args: [
                    "--require ls:livescript",
                    "--require coffee:coffee-script/register",
                    "--require js:babel-register",
                ].join(" "),
                loader: constant([
                    {ext: ".ls", mod: "livescript"},
                    {ext: ".coffee", mod: "coffee-script/register"},
                    {ext: ".js", mod: "babel-register"},
                ]),
            })
        })

        context("config", function () {
            ignore("in JS", "--config foo.js")

            load("in CoffeeScript", {
                args: "--config foo.coffee",
                loader: constant([".coffee"]),
            })

            load("in Babel", {
                args: "--config foo.babel.js",
                loader: constant([".babel.js"]),
            })

            load("in CoffeeScript-in-Markdown", {
                args: "--config foo.coffee.md",
                loader: constant([".coffee.md"]),
            })

            ignore("when non-executable", "--config foo.md")
            ignore("when extension-free", "--config foo")
            ignore("when extension-free dotfile", "--config .coffee")
            ignore("when dotfile with executable extension", "--config .babel.js") // eslint-disable-line max-len
            ignore("when dotfile with non-executable extension", "--config .coffee.md") // eslint-disable-line max-len
        })

        context("files", function () {
            ignore("when unknown", "test/**/*.(js|coffee)")
            ignore("when any", "test/**/*.*")
            ignore("when missing", "test/**")
            ignore("in JS", "test/**/*.js")

            load("in CoffeeScript", {
                args: "test/**/*.coffee",
                loader: constant([".coffee"]),
            })

            load("in Babel", {
                args: "test/**/*.babel.js",
                loader: constant([".babel.js"]),
            })

            load("in CoffeeScript-in-Markdown", {
                args: "test/**/*.coffee.md",
                loader: constant([".coffee.md"]),
            })

            // Edge cases
            ignore("non-executable", "test/**/*.md")
            ignore("extension-free", "test/**/foo")
            ignore("extension-free dotfile", "test/**/.coffee")
            ignore("dotfile with executable extension", "test/**/.babel.js")
            ignore("dotfile with non-executable extension", "test/**/.coffee.md") // eslint-disable-line max-len

            load("with many various globs", {
                args: [
                    "test/**/*.js",
                    "test/**/*.coffee",
                    "test/**/*.litcoffee",
                    "test/**/*.ls",
                ].join(" "),
                loader: constant([".coffee", ".litcoffee", ".ls"]),
            })
        })

        load("with very complex args that mostly belong in a config file", {
            args: [
                "--require my-shell:@company/my-shell/register",
                "--require js:./babel-register-wrapper",
                "test/**/*.js",
                "test/**/*.ls",
                "test/**/*.coffee",
                "--require ./util/env.my-shell",
                "--config @company/backend/config.js",
            ].join(" "),
            loader: function (l) {
                return [
                    {ext: ".my-shell", mod: "@company/my-shell/register"},
                    {ext: ".js", mod: "./babel-register-wrapper"},
                    ".ls",
                    ".coffee",
                    [0, new LoaderData.Simple("./util/env.my-shell", l.load)],
                ]
            },
        })
    })

    context("class Simple", function () {
        it("calls `load` when `register` is called", function () {
            var called = 0

            function load(mod, baseDir) {
                called++
                t.equal(mod, "module")
                t.equal(baseDir, ".")
            }

            return new LoaderData.Simple("module", load)
            .register(".")
            .then(function () {
                t.equal(called, 1)
            })
        })

        it("calls `load` only once", function () {
            var called = 0

            function load(mod, baseDir) {
                called++
                t.equal(mod, "module")
                t.equal(baseDir, ".")
            }

            var loader = new LoaderData.Simple("module", load)

            return Promise.resolve()
            .then(function () { return loader.register(".") })
            .then(function () { return loader.register(".") })
            .then(function () { return loader.register(".") })
            .then(function () {
                t.equal(called, 1)
            })
        })
    })

    context("class Register", function () {
        it("calls `load` when `register` is called", function () {
            var called = 0

            function load(mod, baseDir) {
                called++
                t.equal(mod, "module")
                t.equal(baseDir, ".")
            }

            return new LoaderData.Register(".mod", "module", load, true)
            .register(".")
            .then(function () {
                t.equal(called, 1)
            })
        })

        it("doesn't call `load` when `use` is `false`", function () {
            var called = 0

            function load(mod, baseDir) {
                called++
                t.equal(mod, "module")
                t.equal(baseDir, ".")
            }

            return new LoaderData.Register(".mod", "module", load, false)
            .register(".")
            .then(function () {
                t.equal(called, 0)
            })
        })

        it("calls `load` only once", function () {
            var called = 0

            function load(mod, baseDir) {
                called++
                t.equal(mod, "module")
                t.equal(baseDir, ".")
            }

            var loader = new LoaderData.Register(".mod", "module", load, true)

            return Promise.resolve()
            .then(function () { return loader.register(".") })
            .then(function () { return loader.register(".") })
            .then(function () { return loader.register(".") })
            .then(function () {
                t.equal(called, 1)
            })
        })

        it("calls `load` once if the first module in a list works", function () { // eslint-disable-line max-len
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
            }

            return new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register(".")
            .then(function () {
                t.equal(called, 1)
                t.match(mods, ["foo"])
            })
        })

        it("calls `load` for every module if only the last works", function () {
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called < 4) throw new Error("nope")
            }

            return new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register(".")
            .then(function () {
                t.equal(called, 4)
                t.match(mods, [
                    "foo",
                    "bar",
                    "baz",
                    "whatever",
                ])
            })
        })

        it("calls `load` for some modules if one in the middle works", function () { // eslint-disable-line max-len
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called < 2) throw new Error("nope")
            }

            return new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register(".")
            .then(function () {
                t.equal(called, 2)
                t.match(mods, ["foo", "bar"])
            })
        })

        it("understands register objects", function () {
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
            }

            return new LoaderData.Register(".mod", [
                {
                    module: "foo",
                    register: function () { throw new Error("nope") },
                },
                "bar",
                "baz",
                "whatever",
            ], load, true).register(".")
            .then(function () {
                t.equal(called, 3)
                t.match(mods, ["foo", "bar", "baz"])
            })
        })
    })
})
