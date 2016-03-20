import deepcopy from "deepcopy"

import t from "../../../src/index.js"
import {merge} from "../../../src/cli/merge-json-config.js"

// Alias for wrapping
const test1 = test

suite("cli json (merging)", () => {
    function test(name, {original, schema, merged}) {
        test1(name, () => {
            const local = deepcopy(original)

            merge(local, schema)
            t.deepEqual(local, merged)
        })
    }

    function set(set, value) {
        return {set, value}
    }

    test("merges an empty object", {
        original: {
            module: set(false, "techtonic"),
            cwd: set(false, "foo"),
            register: set(false, []),
            files: set(false, []),
            reporters: set(false, []),
            help: null,
        },
        schema: {},
        merged: {
            module: set(false, "techtonic"),
            cwd: set(false, "foo"),
            register: set(false, []),
            files: set(false, []),
            reporters: set(false, []),
            help: null,
        },
    })

    suite("unset", () => {
        test("merges `config`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                config: "test/my-config.js",
            },
            merged: {
                config: set(true, "test/my-config.js"),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `module`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                module: "./some-techtonic-wrapper.js",
            },
            merged: {
                config: set(false, null),
                module: set(true, "./some-techtonic-wrapper.js"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `register`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                register: ["ls"],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(true, ["ls"]),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `reporters`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                reporters: [["techtonic/r/spec", {color: false}]],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(true, [
                    {module: "techtonic/r/spec", args: [{color: false}]},
                ]),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `files`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                files: ["other/**"],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(true, ["other/**"]),
                help: null,
            },
        })

        test("merges everything", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                config: "test/my-config.js",
                module: "./some-techtonic-wrapper.js",
                register: ["ls"],
                reporters: [["techtonic/r/spec", {color: false}]],
                files: ["other/**"],
            },
            merged: {
                config: set(true, "test/my-config.js"),
                module: set(true, "./some-techtonic-wrapper.js"),
                cwd: set(false, "foo"),
                register: set(true, ["ls"]),
                reporters: set(true, [
                    {module: "techtonic/r/spec", args: [{color: false}]},
                ]),
                files: set(true, ["other/**"]),
                help: null,
            },
        })
    })

    suite("set", () => {
        test("merges `config`", {
            original: {
                config: set(true, "test/old.js"),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                config: "test/my-config.js",
            },
            merged: {
                config: set(true, "test/old.js"),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `module`", {
            original: {
                config: set(false, null),
                module: set(true, "./old.js"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                module: "./some-techtonic-wrapper.js",
            },
            merged: {
                config: set(false, null),
                module: set(true, "./old.js"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `register`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(true, ["coffee"]),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
            schema: {
                register: ["ls"],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(true, ["coffee", "ls"]),
                reporters: set(false, []),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `reporters`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(true, [{module: "./coverage.js", args: []}]),
                files: set(false, []),
                help: null,
            },
            schema: {
                reporters: [["techtonic/r/spec", {color: false}]],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(true, [
                    {module: "./coverage.js", args: []},
                    {module: "techtonic/r/spec", args: [{color: false}]},
                ]),
                files: set(false, []),
                help: null,
            },
        })

        test("merges `files`", {
            original: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(true, ["custom/**/*.test.js"]),
                help: null,
            },
            schema: {
                files: ["other/**"],
            },
            merged: {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "foo"),
                register: set(false, []),
                reporters: set(false, []),
                files: set(true, ["custom/**/*.test.js", "other/**"]),
                help: null,
            },
        })

        test("merges everything", {
            original: {
                config: set(true, "test/old.js"),
                module: set(true, "./old.js"),
                cwd: set(false, "foo"),
                register: set(true, ["coffee"]),
                reporters: set(true, [{module: "./coverage.js", args: []}]),
                files: set(true, ["custom/**/*.test.js"]),
                help: null,
            },
            schema: {
                config: "test/my-config.js",
                module: "./some-techtonic-wrapper.js",
                register: ["ls"],
                reporters: [["techtonic/r/spec", {color: false}]],
                files: ["other/**"],
            },
            merged: {
                config: set(true, "test/old.js"),
                module: set(true, "./old.js"),
                cwd: set(false, "foo"),
                register: set(true, ["coffee", "ls"]),
                reporters: set(true, [
                    {module: "./coverage.js", args: []},
                    {module: "techtonic/r/spec", args: [{color: false}]},
                ]),
                files: set(true, ["custom/**/*.test.js", "other/**"]),
                help: null,
            },
        })
    })
})
