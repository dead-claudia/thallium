"use strict"

// const path = require("path")
// const interpret = require("interpret")

const t = require("../../index.js")
const findConfig = require("../../lib/cli/find-config.js")
const LoaderData = require("../../lib/cli/loader-data.js")
const Util = require("../../test-util/cli.js")

describe("cli config finder", () => {
    // It's easiest to depend on LoaderData.extractIntoMap being right, since
    // I don't have to rely on the data structures instead, which would make the
    // tests much more redundant.
    function finder(name, opts) {
        it(name, () => {
            const mock = Util.mock(opts.tree)
            const loader = new Util.Loader(opts.args, mock)
            const map = LoaderData.extractIntoMap(loader.state)
            const file = findConfig(loader.state, map)
            const found = opts.found != null ? mock.resolve(opts.found) : null

            t.equal(file, found)

            if (found != null && LoaderData.isValid(found)) {
                t.hasOwn(map.get(LoaderData.getExt(found)), "use", true)
            }
        })
    }

    /* eslint-disable max-len */

    context("default path", () => {
        finder("when it's JS", {
            tree: {
                test: {".techtonic.js": "contents"},
            },
            args: "",
            found: "test/.techtonic.js",
        })

        finder("when it's CoffeeScript", {
            tree: {
                test: {".techtonic.coffee": "contents"},
            },
            args: "",
            found: "test/.techtonic.coffee",
        })

        finder("when it's Babel + JS", {
            tree: {
                test: {".techtonic.babel.js": "contents"},
            },
            args: "",
            found: "test/.techtonic.babel.js",
        })

        finder("when it's literate CoffeeScript", {
            tree: {
                test: {".techtonic.coffee.md": "contents"},
            },
            args: "",
            found: "test/.techtonic.coffee.md",
        })
    })

    context("no config", () => {
        finder("returns null when none exists", {
            tree: {
                test: {"nope.js": ""},
            },
            args: "",
            found: null,
        })

        finder("returns null when non-executable extension exists", {
            tree: {
                test: {".techtonic.json": "contents"},
            },
            args: "",
            found: null,
        })

        finder("returns null when a directory", {
            tree: {
                test: {".techtonic.js": {}},
            },
            args: "",
            found: null,
        })
    })

    context("--config", () => {
        finder("gets a specific config", {
            tree: {
                test: {".techtonic.js": "contents"},
                other: {"foo.js": "contents"},
            },
            args: "--config other/foo.js",
            found: "other/foo.js",
        })

        finder("gets a specific config that doesn't exist", {
            tree: {
                test: {".techtonic.js": "contents"},
                other: {"foo.js": "contents"},
            },
            args: "--config other/what.js",
            found: "other/what.js",
        })

        finder("gets a config with an unknown extension", {
            tree: {
                test: {".techtonic.js": "contents"},
                other: {"foo.config": "contents"},
            },
            args: "--config other/foo.config",
            found: "other/foo.config",
        })
    })

    context("from globs", () => {
        finder("when in a single file glob", {
            tree: {
                src: {".techtonic.coffee": "contents"},
            },
            args: "src/**/*.test.coffee",
            found: "src/.techtonic.coffee",
        })

        finder("when in the first of many file globs", {
            tree: {
                src1: {".techtonic.coffee": "contents"},
            },
            args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
            found: "src1/.techtonic.coffee",
        })

        finder("when in the middle of many file globs", {
            tree: {
                src2: {".techtonic.ls": "contents"},
            },
            args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
            found: "src2/.techtonic.ls",
        })

        finder("when in the last of many file globs", {
            tree: {
                src3: {".techtonic.litcoffee": "contents"},
            },
            args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
            found: "src3/.techtonic.litcoffee",
        })

        finder("when specified in later globs", {
            tree: {
                src1: {".techtonic.ls": "contents"},
            },
            args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
            found: null,
        })

        finder("when specified in previous globs", {
            tree: {
                src3: {".techtonic.ls": "contents"},
            },
            args: "src1/**/*.test.coffee src2/**/*.test.ls src3/**/*.test.litcoffee",
            found: null,
        })

        finder("when none satisfy any glob ext", {
            tree: {
                src: {".techtonic.js": "contents"},
            },
            args: "src/**/*.test.coffee src/**/*.test.ls src/**/*.test.litcoffee",
            found: "src/.techtonic.js",
        })

        finder("when no glob has any ext, but a JS file exists", {
            tree: {
                test1: {".techtonic.js": "contents"},
            },
            args: "test1/** test2/** test3/**",
            found: "test1/.techtonic.js",
        })

        finder("when no glob has any ext, but a CoffeeScript file exists", {
            tree: {
                test1: {".techtonic.coffee": "contents"},
            },
            args: "test1/** test2/** test3/**",
            found: "test1/.techtonic.coffee",
        })

        finder("when no glob has any ext, but a Babel + JS file exists", {
            tree: {
                test1: {".techtonic.babel.js": "contents"},
            },
            args: "test1/** test2/** test3/**",
            found: "test1/.techtonic.babel.js",
        })
    })

    context("recursion", () => {
        finder("when up a level", {
            tree: {
                "test": {"test.js": "contents"},
                ".techtonic.js": "contents",
            },
            args: "",
            found: ".techtonic.js",
        })

        finder("when at the root with a deep glob", {
            tree: {
                "test": {
                    util: {
                        helpers: {"test.js": "contents"},
                    },
                },
                ".techtonic.js": "contents",
            },
            args: "test/util/helpers/**",
            found: ".techtonic.js",
        })

        finder("when up a level in the middle", {
            tree: {
                test: {
                    "helpers": {"test.js": "contents"},
                    ".techtonic.js": "contents",
                },
            },
            args: "test/helpers/**",
            found: "test/.techtonic.js",
        })

        finder("when in the middle with a deep glob", {
            tree: {
                test: {
                    "util": {
                        helpers: {"test.js": "contents"},
                    },
                    ".techtonic.js": "contents",
                },
            },
            args: "test/util/helpers/**",
            found: "test/.techtonic.js",
        })
    })

    context("precedence", () => {
        finder("prefers the first glob over others", {
            tree: {
                test1: {".techtonic.js": "contents"},
                test2: {".techtonic.js": "contents"},
                test3: {".techtonic.js": "contents"},
            },
            args: "test1/** test2/** test3/**",
            found: "test1/.techtonic.js",
        })

        finder("prefers --config to globs", {
            tree: {
                test1: {".techtonic.js": "contents"},
                test2: {".techtonic.js": "contents"},
                test3: {".techtonic.js": "contents"},
            },
            args: "--config foo.js test1/** test2/** test3/**",
            found: "foo.js",
        })

        finder("prefers --config to JS", {
            tree: {
                test: {
                    ".techtonic.coffee": "contents",
                    ".techtonic.js": "contents",
                },
            },
            args: "--config test/.techtonic.coffee",
            found: "test/.techtonic.coffee",
        })

        finder("prefers glob to JS", {
            tree: {
                test: {
                    ".techtonic.coffee": "contents",
                    ".techtonic.js": "contents",
                },
            },
            args: "test/**/*.coffee",
            found: "test/.techtonic.coffee",
        })
    })

    /* eslint-enable max-len */
})
