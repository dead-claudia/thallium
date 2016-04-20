"use strict"

// const path = require("path")

const interpret = require("interpret")
const t = require("../../index.js")
const LoaderData = require("../../lib/cli/loader-data.js")
const Util = require("../../test-util/cli.js")

const hasOwn = Object.prototype.hasOwnProperty

describe("cli config loader data", () => {
    function forEachVariantExt(f) {
        Object.keys(interpret.jsVariants).forEach(f)
    }

    function forEachDataExt(f) {
        Object.keys(interpret.extensions)
        .filter(key => !hasOwn.call(interpret.jsVariants, key))
        .forEach(f)
    }

    context("isValid()", () => {
        it("exists", () => {
            t.hasKey(LoaderData, "isValid")
            t.function(LoaderData.isValid)
        })

        forEachVariantExt(key => {
            it(`validates ${key}`, () => {
                t.true(LoaderData.isValid(`file${key}`))
                t.true(LoaderData.isValid(`module/dir.wtf/file.!!!${key}`))
                // Only check this for single-extension keys.
                if (!/^\..*\./.test(key)) t.false(LoaderData.isValid(key))
                // This should never be a key, as it semantically doesn't
                // represent code.
                t.false(LoaderData.isValid(`file${key}.docx`))
            })
        })

        forEachDataExt(key => {
            it(`fails to validate ${key}`, () => {
                t.false(LoaderData.isValid(`file${key}`))
                t.false(LoaderData.isValid(`module/dir.wtf/file.!!!${key}`))
                t.false(LoaderData.isValid(`file${key}.docx`))

                // Redundant, but it works.
                t.true(LoaderData.isValid(`file${key}.js`))
            })
        })
    })

    context("getExt()", () => {
        it("exists", () => {
            t.hasKey(LoaderData, "getExt")
            t.function(LoaderData.getExt)
        })

        forEachVariantExt(key => {
            it(`gets ${key}`, () => {
                t.equal(LoaderData.getExt(`file${key}`), key)
                t.equal(LoaderData.getExt(`module/dir.wtf/file.!!!${key}`), key)
            })
        })

        it("gets exts after invalid exts", () => {
            forEachDataExt(key => {
                t.equal(LoaderData.getExt(`file${key}.js`), ".js")
            })
        })
    })

    context("extractIntoMap()", () => {
        class Loader extends Util.Loader {
            constructor(argv) {
                super(argv, {
                    load: () => this.calls++,
                    cwd: () => ".",
                })
                this.calls = 0
            }

            // Partially copied from the module itself. Checks and cleans the
            // map of default keys.
            clean(map) {
                super.clean(map)
                t.equal(this.calls, 0)
                return map
            }
        }

        function load(name, opts) {
            it(name, () => {
                const loader = new Loader(opts.args)
                const map = LoaderData.extractIntoMap(loader.state)
                let list = opts.loader(loader)

                if (!Array.isArray(list)) list = [list]

                t.match(loader.clean(map), new Map(list.map(l => {
                    if (Array.isArray(l)) return l
                    if (typeof l === "string") return [l, loader.register(l)]
                    return [l.ext, loader.require(l.ext, l.mod, true)]
                })))
            })
        }

        function ignore(name, args) {
            load(name, {args, loader: () => []})
        }

        it("exists", () => {
            t.hasKey(LoaderData, "extractIntoMap")
            t.function(LoaderData.extractIntoMap)
        })

        ignore("with empty arguments", "")

        context("require", () => {
            load("with custom JS hook", {
                args: "--require js:./my-custom-hook.js",
                loader: () => ({
                    ext: ".js",
                    mod: "./my-custom-hook.js",
                }),
            })

            load("with custom CoffeeScript hook", {
                args: "--require coffee:coffee-script-redux/register",
                loader: () => ({
                    ext: ".coffee",
                    mod: "coffee-script-redux/register",
                }),
            })

            load("with previously unknown extension", {
                args: "--require my-shell:@company/my-shell/register",
                loader: () => ({
                    ext: ".my-shell",
                    mod: "@company/my-shell/register",
                }),
            })

            load("with multiple extensions", {
                args: `
                    --require ls:livescript
                    --require coffee:coffee-script/register
                    --require js:babel-register
                `,
                loader: () => [
                    {ext: ".ls", mod: "livescript"},
                    {ext: ".coffee", mod: "coffee-script/register"},
                    {ext: ".js", mod: "babel-register"},
                ],
            })
        })

        context("config", () => {
            ignore("in JS", "--config foo.js")

            load("in CoffeeScript", {
                args: "--config foo.coffee",
                loader: () => [".coffee"],
            })

            load("in Babel", {
                args: "--config foo.babel.js",
                loader: () => [".babel.js"],
            })

            load("in CoffeeScript-in-Markdown", {
                args: "--config foo.coffee.md",
                loader: () => [".coffee.md"],
            })

            ignore("when non-executable", "--config foo.md")
            ignore("when extension-free", "--config foo")
            ignore("when extension-free dotfile", "--config .coffee")
            ignore("when dotfile with executable extension", "--config .babel.js") // eslint-disable-line max-len
            ignore("when dotfile with non-executable extension", "--config .coffee.md") // eslint-disable-line max-len
        })

        context("files", () => {
            ignore("when unknown", "test/**/*.(js|coffee)")
            ignore("when any", "test/**/*.*")
            ignore("when missing", "test/**")
            ignore("in JS", "test/**/*.js")

            load("in CoffeeScript", {
                args: "test/**/*.coffee",
                loader: () => [".coffee"],
            })

            load("in Babel", {
                args: "test/**/*.babel.js",
                loader: () => [".babel.js"],
            })

            load("in CoffeeScript-in-Markdown", {
                args: "test/**/*.coffee.md",
                loader: () => [".coffee.md"],
            })

            // Edge cases
            ignore("non-executable", "test/**/*.md")
            ignore("extension-free", "test/**/foo")
            ignore("extension-free dotfile", "test/**/.coffee")
            ignore("dotfile with executable extension", "test/**/.babel.js")
            ignore("dotfile with non-executable extension", "test/**/.coffee.md") // eslint-disable-line max-len

            load("with many various globs", {
                args: `
                    test/**/*.js
                    test/**/*.coffee
                    test/**/*.litcoffee
                    test/**/*.ls
                `,
                loader: () => [".coffee", ".litcoffee", ".ls"],
            })
        })

        load("with very complex args that mostly belong in a config file", {
            args: `
                --require my-shell:@company/my-shell/register
                --require js:./babel-register-wrapper
                test/**/*.js
                test/**/*.ls
                test/**/*.coffee
                --require ./util/env.my-shell
                --config @company/backend/config.js
            `,
            loader: l => [
                {ext: ".my-shell", mod: "@company/my-shell/register"},
                {ext: ".js", mod: "./babel-register-wrapper"},
                ".ls",
                ".coffee",
                [0, new LoaderData.Simple("./util/env.my-shell", l.load)],
            ],
        })
    })

    context("class Simple", () => {
        it("calls `load` when `register` is called", () => {
            let called = 0

            const load = mod => {
                called++
                t.equal(mod, "module")
            }

            new LoaderData.Simple("module", load).register()

            t.equal(called, 1)
        })

        it("calls `load` only once", () => {
            let called = 0

            const load = mod => {
                called++
                t.equal(mod, "module")
            }

            const loader = new LoaderData.Simple("module", load)

            loader.register()
            loader.register()
            loader.register()

            t.equal(called, 1)
        })
    })

    context("class Register", () => {
        it("calls `load` when `register` is called", () => {
            let called = 0

            const load = mod => {
                called++
                t.equal(mod, "module")
            }

            new LoaderData.Register(".mod", "module", load, true).register()

            t.equal(called, 1)
        })

        it("doesn't call `load` when `use` is `false`", () => {
            let called = 0

            const load = mod => {
                called++
                t.equal(mod, "module")
            }

            new LoaderData.Register(".mod", "module", load, false).register()

            t.equal(called, 0)
        })

        it("calls `load` only once", () => {
            let called = 0

            const load = mod => {
                called++
                t.equal(mod, "module")
            }

            const loader = new LoaderData.Register(".mod", "module", load, true)

            loader.register()
            loader.register()
            loader.register()

            t.equal(called, 1)
        })

        it("calls `load` once if the first module in a list works", () => {
            const mods = []
            let called = 0

            const load = mod => {
                called++
                mods.push(mod)
            }

            new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register()

            t.equal(called, 1)
            t.match(mods, ["foo"])
        })

        it("calls `load` for every module if only the last works", () => {
            const mods = []
            let called = 0

            const load = mod => {
                called++
                mods.push(mod)
                if (called < 4) throw new Error("nope")
            }

            new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register()

            t.equal(called, 4)
            t.match(mods, [
                "foo",
                "bar",
                "baz",
                "whatever",
            ])
        })

        it("calls `load` for some modules if one in the middle works", () => {
            const mods = []
            let called = 0

            const load = mod => {
                called++
                mods.push(mod)
                if (called < 2) throw new Error("nope")
            }

            new LoaderData.Register(".mod", [
                "foo",
                "bar",
                "baz",
                "whatever",
            ], load, true).register()

            t.equal(called, 2)
            t.match(mods, ["foo", "bar"])
        })

        it("understands register objects", () => {
            const mods = []
            let called = 0

            const load = mod => {
                called++
                mods.push(mod)
                if (called === 2) throw new Error("nope")
            }

            new LoaderData.Register(".mod", [
                {module: "foo", register() { throw new Error("nope") }},
                "bar",
                "baz",
                "whatever",
            ], load, true).register()

            t.equal(called, 3)
            t.match(mods, ["foo", "bar", "baz"])
        })
    })
})
