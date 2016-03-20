import * as path from "path"

import t from "../../../src/index.js"
import {parseArgs} from "../../../src/cli/parse-args.js"

// Pull it out to safely wrap.
const test1 = test

suite("cli arguments (multiple)", () => { // eslint-disable-line max-statements
    const defaultCwd = "base"
    const testDir = path.join("test", "**")

    function set(set, value) {
        return {set, value}
    }

    function test(description, str, {
        config = set(false, null),
        module = set(false, "techtonic"),
        cwd = set(false, defaultCwd),
        register = set(false, []),
        files = set(false, [testDir]),
        reporters = set(false, []),
        help = null,
    } = {}) {
        str = str.trim()
        test1(description, () => {
            t.deepEqual(parseArgs(defaultCwd, str ? str.split(/\s+/g) : []), {
                config, module, cwd, register, files, reporters, help,
            })
        })
    }

    test("works with multiple reporters via --reporter",
        "--reporter foo --reporter bar",
        {reporters: set(true, [
            {module: "foo", args: []},
            {module: "bar", args: []},
        ])})

    test("works with multiple reporters via -R",
        "-R foo -R bar",
        {reporters: set(true, [
            {module: "foo", args: []},
            {module: "bar", args: []},
        ])})
})
