"use strict"

var path = require("path")
var interpret = require("interpret")
var Promise = require("bluebird")
var t = require("../index.js")
var methods = require("../lib/common.js").methods
var Loader = require("../lib/cli-loader.js")
var Util = require("../helpers/cli.js")

var hasOwn = Object.prototype.hasOwnProperty

describe("cli loader", function () {
    describe("findConfig()", function () {
        // It's easiest to depend on Loader.extractIntoMap being right,
        // since I am not nearly as coupled to the underlying data
        // representation, and don't have to redundantly specify the same list.
        function finder(name, opts) {
            it(name, function () {
                var mock = Util.mock(opts.tree)
                var loader = new Util.Loader(opts.args, mock)
                var found = opts.found != null ? mock.resolve(opts.found) : null

                mock.chdir(loader.state.args.cwd)

                var map = Loader.extractIntoMap(loader.state)
                var file = Loader.findConfig(loader.state, map)

                t.equal(file, found)

                if (found != null && Loader.isValid(found)) {
                    t.hasOwn(map[Loader.getExt(found)], "use", true)
                }
            })
        }

        /* eslint-disable max-len */

        context("default path", function () {
            finder("when it's JS", {
                tree: {
                    test: {".tl.js": "contents"},
                },
                args: "",
                found: "test/.tl.js",
            })

            finder("when it's CoffeeScript", {
                tree: {
                    test: {".tl.coffee": "contents"},
                },
                args: "",
                found: "test/.tl.coffee",
            })

            finder("when it's Babel + JS", {
                tree: {
                    test: {".tl.babel.js": "contents"},
                },
                args: "",
                found: "test/.tl.babel.js",
            })

            finder("when it's literate CoffeeScript", {
                tree: {
                    test: {".tl.coffee.md": "contents"},
                },
                args: "",
                found: "test/.tl.coffee.md",
            })
        })

        context("no config", function () {
            finder("returns null when none exists", {
                tree: {
                    test: {"nope.js": ""},
                },
                args: "",
                found: null,
            })

            finder("returns null when non-executable extension exists", {
                tree: {
                    test: {".tl.json": "contents"},
                },
                args: "",
                found: null,
            })

            finder("returns null when a directory", {
                tree: {
                    test: {".tl.js": {}},
                },
                args: "",
                found: null,
            })
        })

        context("--config", function () {
            finder("gets a specific config", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.js": "contents"},
                },
                args: "--config other/foo.js",
                found: "other/foo.js",
            })

            finder("gets a specific config that doesn't exist", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.js": "contents"},
                },
                args: "--config other/what.js",
                found: "other/what.js",
            })

            finder("gets a config with an unknown extension", {
                tree: {
                    test: {".tl.js": "contents"},
                    other: {"foo.config": "contents"},
                },
                args: "--config other/foo.config",
                found: "other/foo.config",
            })
        })

        context("from globs", function () {
            finder("when in a single file glob", {
                tree: {
                    src: {".tl.coffee": "contents"},
                },
                args: "src/**/*.test.coffee",
                found: "src/.tl.coffee",
            })

            finder("when in the first of many file globs", {
                tree: {
                    src1: {".tl.coffee": "contents"},
                },
                args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
                found: "src1/.tl.coffee",
            })

            finder("when in the middle of many file globs", {
                tree: {
                    src2: {".tl.ls": "contents"},
                },
                args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
                found: "src2/.tl.ls",
            })

            finder("when in the last of many file globs", {
                tree: {
                    src3: {".tl.litcoffee": "contents"},
                },
                args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
                found: "src3/.tl.litcoffee",
            })

            finder("when specified in later globs", {
                tree: {
                    src1: {".tl.ls": "contents"},
                },
                args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
                found: null,
            })

            finder("when specified in previous globs", {
                tree: {
                    src3: {".tl.ls": "contents"},
                },
                args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
                found: null,
            })

            finder("when none satisfy any glob ext", {
                tree: {
                    src: {".tl.js": "contents"},
                },
                args: "src/**/*.test.coffee src/**/*.test.ls src/**/*.test.litcoffee",
                found: "src/.tl.js",
            })

            finder("when no glob has any ext, but a JS file exists", {
                tree: {
                    test1: {".tl.js": "contents"},
                },
                args: "test1/** test2/** test3/**",
                found: "test1/.tl.js",
            })

            finder("when no glob has any ext, but a CoffeeScript file exists", {
                tree: {
                    test1: {".tl.coffee": "contents"},
                },
                args: "test1/** test2/** test3/**",
                found: "test1/.tl.coffee",
            })

            finder("when no glob has any ext, but a Babel + JS file exists", {
                tree: {
                    test1: {".tl.babel.js": "contents"},
                },
                args: "test1/** test2/** test3/**",
                found: "test1/.tl.babel.js",
            })
        })

        context("recursion", function () {
            finder("when up a level", {
                tree: {
                    "test": {"test.js": "contents"},
                    ".tl.js": "contents",
                },
                args: "",
                found: ".tl.js",
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
                args: "test/util/helpers/**",
                found: ".tl.js",
            })

            finder("when up a level in the middle", {
                tree: {
                    test: {
                        "helpers": {"test.js": "contents"},
                        ".tl.js": "contents",
                    },
                },
                args: "test/helpers/**",
                found: "test/.tl.js",
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
                args: "test/util/helpers/**",
                found: "test/.tl.js",
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
                found: "test1/.tl.js",
            })

            finder("prefers --config to globs", {
                tree: {
                    test1: {".tl.js": "contents"},
                    test2: {".tl.js": "contents"},
                    test3: {".tl.js": "contents"},
                },
                args: "--config foo.js test1/** test2/** test3/**",
                found: "foo.js",
            })

            finder("prefers --config to JS", {
                tree: {
                    test: {
                        ".tl.coffee": "contents",
                        ".tl.js": "contents",
                    },
                },
                args: "--config test/.tl.coffee",
                found: "test/.tl.coffee",
            })

            finder("prefers glob to JS", {
                tree: {
                    test: {
                        ".tl.coffee": "contents",
                        ".tl.js": "contents",
                    },
                },
                args: "test/**/*.coffee",
                found: "test/.tl.coffee",
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
                found: "module/mytest/.tl.js",
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
                found: "module/mytest/.tl.js",
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
                found: "module/test/.tl.js",
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
                found: "module/test/test/.tl.js",
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
                found: "module/foo/bar/test/.tl.js",
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
                found: "module/test/.tl-config.js",
            })

            // The mock resolves in a platform-specific manner. This also assumes
            // Unix-style paths.
            function abs(file) {
                if (process.platorm === "win32") file = "C:" + file
                return path.resolve(file)
            }

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
                args: "--cwd module --config " + abs("/other/test/.tl-config.js"),
                found: "other/test/.tl-config.js",
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
                args: "--cwd module " + abs("/other/test/**"),
                found: "other/test/.tl.js",
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
                args: "--cwd module " + abs("/other/test/**"),
                found: ".tl.js",
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
                args: "--cwd module " + abs("/module/other/test/**"),
                found: "module/.tl.js",
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
                args: "--cwd module/other " + abs("/other/test/**"),
                found: ".tl.js",
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
                args: "--cwd module/other " + abs("/module/other/test/**"),
                found: ".tl.js",
            })
        })

        /* eslint-enable max-len */
    })

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
            t.function(Loader.isValid)
        })

        forEachVariantExt(function (key) {
            it("validates " + key, function () {
                t.true(Loader.isValid("file" + key))
                t.true(Loader.isValid("module/dir.wtf/file.!!!" + key))
                // Only check this for single-extension keys.
                if (!/^\..*\./.test(key)) t.false(Loader.isValid(key))
                // This should never be a key, as it semantically doesn't
                // represent code.
                t.false(Loader.isValid("file" + key + ".docx"))
            })
        })

        forEachDataExt(function (key) {
            it("fails to validate " + key, function () {
                t.false(Loader.isValid("file" + key))
                t.false(Loader.isValid("module/dir.wtf/file.!!!" + key))
                t.false(Loader.isValid("file" + key + ".docx"))

                // Redundant, but it works.
                t.true(Loader.isValid("file" + key + ".js"))
            })
        })
    })

    context("getExt()", function () {
        it("exists", function () {
            t.function(Loader.getExt)
        })

        forEachVariantExt(function (key) {
            it("gets " + key, function () {
                t.equal(Loader.getExt("file" + key), key)
                t.equal(Loader.getExt("module/dir.wtf/file.!!!" + key), key)
            })
        })

        it("gets exts after invalid exts", function () {
            forEachDataExt(function (key) {
                t.equal(Loader.getExt("file" + key + ".js"), ".js")
            })
        })
    })

    context("extractIntoMap()", function () {
        function Mock(argv) {
            var self = this

            Util.Loader.call(this, argv, {
                load: function () { self.calls++ },
                cwd: function () { return "." },
            })
            this.calls = 0
        }

        methods(Mock, Util.Loader, {
            require: function (ext, mod, use) {
                return new Loader.Register(ext, mod, this.load, use)
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
                            t.deepEqual(data, Loader.jsLoader)
                        } else {
                            var mod = interpret.jsVariants[ext]
                            var expected =
                                new Loader.Register(ext, mod, self.load)

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
                var loader = new Mock(opts.args)
                var map = Loader.extractIntoMap(loader.state)
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
            t.function(Loader.extractIntoMap)
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
                    [0, new Loader.Simple("./util/env.my-shell", l.load)],
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

            return new Loader.Simple("module", load)
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

            var loader = new Loader.Simple("module", load)

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

            return new Loader.Register(".mod", "module", load, true)
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

            return new Loader.Register(".mod", "module", load, false)
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

            var loader = new Loader.Register(".mod", "module", load, true)

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

            return new Loader.Register(".mod", [
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

            return new Loader.Register(".mod", [
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

            return new Loader.Register(".mod", [
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

        it("reads unspecified register objects", function () {
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
            }

            var loader = new Loader.Register(".mod", [
                {
                    module: "foo",
                    register: function () { throw new Error("nope") },
                },
                "bar",
                "baz",
                "whatever",
            ], load, false)

            loader.use = true

            return loader.register(".")
            .then(function () {
                t.equal(called, 3)
                t.match(mods, ["foo", "bar", "baz"])
            })
        })

        it("reads nothing from explicitly specified modules", function () {
            var mods = []
            var called = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
            }

            return new Loader.Register(".mod", ["foo"], load, true)
            .register(".")
            .then(function () {
                t.equal(called, 1)
                t.match(mods, ["foo"])
            })
        })

        it("reads thenables from explicitly specified modules", function () {
            var mods = []
            var called = 0
            var init = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
                return {
                    then: function (resolve) {
                        init++
                        resolve()
                    },
                }
            }

            return new Loader.Register(".mod", ["foo"], load, true)
            .register(".")
            .then(function () {
                t.equal(called, 1)
                t.equal(init, 1)
                t.match(mods, ["foo"])
            })
        })

        it("reads ES6 default-exported thenables from explicitly specified modules", function () { // eslint-disable-line max-len
            var mods = []
            var called = 0
            var init = 0

            function load(mod) {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
                return {
                    default: {
                        then: function (resolve) {
                            init++
                            resolve()
                        },
                    },
                }
            }

            return new Loader.Register(".mod", ["foo"], load, true)
            .register(".")
            .then(function () {
                t.equal(called, 1)
                t.equal(init, 1)
                t.match(mods, ["foo"])
            })
        })
    })
})
