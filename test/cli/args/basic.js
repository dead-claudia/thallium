import * as path from "path"

import t from "../../../src/index.js"
import {parseArgs} from "../../../src/cli/parse-args.js"

// Pull it out to safely wrap.
const test1 = test

suite("cli arguments (basic)", () => { // eslint-disable-line max-statements
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

    test("works with defaults", "", {})
    test("works with --help", "--help", {help: arg(true, "simple")})
    test("works with -h", "-h", {help: arg(true, "simple")})
    test("works with --help-detailed", "--help-detailed", {help: arg(true, "detailed")}) // eslint-disable-line max-len
    test("works with -H", "-H", {help: arg(true, "detailed")})
    test("works with --cwd", "--cwd foo", {cwd: arg(true, "foo")})
    test("works with --config", "--config foo", {config: arg(true, "foo")})
    test("works with -c", "-c foo", {config: arg(true, "foo")})

    test("works with --register (with dot + no module)",
        "--register .ext",
            {register: arg(true, [".ext"])})

    test("works with --register (no dot + no module)",
        "--register ext",
            {register: arg(true, ["ext"])})

    test("works with --register (with dot + with module)",
        "--register .ext:module",
            {register: arg(true, [".ext:module"])})

    test("works with --register (no dot + with module)",
        "--register ext:module",
            {register: arg(true, ["ext:module"])})

    test("works with -r (no dot + no module)",
        "-r ext",
            {register: arg(true, ["ext"])})

    test("works with -r (no dot + with module)",
        "-r ext:module",
            {register: arg(true, ["ext:module"])})

    const my = path.join("my-test", "**", "*.js")
    const other = path.join("other-test", "**", "*.js")

    test("works with file arguments",
        `${my} ${other}`,
            {files: arg(true, [my, other])})

    test("works with rest files with invalid options",
        `${my} -- --weird-file.js`,
            {files: arg(true, [my, "--weird-file.js"])})

    test("works with rest files with valid options",
        `${my} -- --module`,
            {files: arg(true, [my, "--module"])})

    // Note: this is a slightly flaky test.
    test("ignores invalid options", "--why -AM -i --here", {})
})
