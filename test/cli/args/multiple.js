import * as path from "path"

import t from "../../../src/index.js"
import {parseArgs} from "../../../src/cli/parse-args.js"

// Pull it out to safely wrap.
const test1 = test

suite("cli arguments (multiple)", () => { // eslint-disable-line max-statements
    const defaultCwd = "base"
    const testDir = path.join("test", "**")

    function arg(passed, value = null) {
        return {passed, value}
    }

    function test(description, str, {
        config = arg(false),
        cwd = arg(false, defaultCwd),
        register = arg(false, []),
        files = arg(false, [testDir]),
        help = arg(false),
    } = {}) {
        str = str.trim()
        test1(description, () => {
            t.deepEqual(parseArgs(defaultCwd, str ? str.split(/\s+/g) : []),
                {config, cwd, register, files, help})
        })
    }

    test("works with multiple register hooks via --register",
        "--register foo:module1 --register bar:module2",
        {register: arg(true, ["foo:module1", "bar:module2"])})

    test("works with multiple register hooks via -r",
        "-r foo:module1 -r bar:module2",
        {register: arg(true, ["foo:module1", "bar:module2"])})
})
