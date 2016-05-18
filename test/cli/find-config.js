"use strict"

var t = require("../../index.js")
var findConfig = require("../../lib/cli/find-config.js")
var LoaderData = require("../../lib/cli/loader-data.js")
var Util = require("../../test-util/cli.js")

describe("cli config finder", function () {
    if (typeof Map !== "function") return

    // It's easiest to depend on LoaderData.extractIntoMap being right, since
    // I don't have to rely on the data structures instead, which would make the
    // tests much more redundant.
    function finder(name, opts) {
        it(name, function () {
            var mock = Util.mock(opts.tree)
            var loader = new Util.Loader(opts.args, mock)
            var found = opts.found != null ? mock.resolve(opts.found) : null
            var map = LoaderData.extractIntoMap(loader.state)
            var file = findConfig(loader.state, map)

            t.equal(file, found)

            if (found != null && LoaderData.isValid(found)) {
                t.hasOwn(map.get(LoaderData.getExt(found)), "use", true)
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

    /* eslint-enable max-len */
})
