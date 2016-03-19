import * as path from "path"

import t from "../../../src/index.js"
import parseArgs from "../../../src/cli/parse-args.js"

// Pull it out to safely wrap.
const test1 = test

suite("cli arguments (basic)", () => { // eslint-disable-line max-statements
    const defaultCwd = "base"
    const defaultConfig = path.join("test", ".techtonic")
    const testDir = path.join("test", "**")

    function set(set, value) {
        return {set, value}
    }

    function test(description, str, {
        config = set(false, defaultConfig),
        module = set(false, null),
        cwd = set(false, defaultCwd),
        register = set(false, []),
        files = set(false, [testDir]),
        reporter = set(false, []),
        help = null,
    } = {}) {
        str = str.trim()
        test1(description, () => {
            t.deepEqual(parseArgs(defaultCwd, str ? str.split(/\s+/g) : []), {
                config, module, cwd, register, files, reporter, help,
            })
        })
    }

    test("works with defaults", "", {})
    test("works with --help", "--help", {help: "simple"})
    test("works with -h", "-h", {help: "simple"})
    test("works with --help-detailed", "--help-detailed", {help: "detailed"})
    test("works with -H", "-H", {help: "detailed"})
    test("works with --cwd", "--cwd foo", {cwd: set(true, "foo")})
    test("works with --config", "--config foo", {config: set(true, "foo")})
    test("works with -c", "-c foo", {config: set(true, "foo")})

    test("works with --register (with dot + no module)",
        "--register .ext",
        {register: set(true, [".ext"])})

    test("works with --register (no dot + no module)",
        "--register ext",
        {register: set(true, ["ext"])})

    test("works with --register (with dot + with module)",
        "--register .ext:module",
        {register: set(true, [".ext:module"])})

    test("works with --register (no dot + with module)",
        "--register ext:module",
        {register: set(true, ["ext:module"])})

    test("works with -r (with dot + no module)",
        "-r .ext",
        {register: set(true, [".ext"])})

    test("works with -r (no dot + no module)",
        "-r ext",
        {register: set(true, ["ext"])})

    test("works with -r (with dot + with module)",
        "-r .ext:module",
        {register: set(true, [".ext:module"])})

    test("works with -r (no dot + with module)",
        "-r ext:module",
        {register: set(true, ["ext:module"])})

    test("works with --module", "--module foo", {module: set(true, "foo")})
    test("works with -m", "-m foo", {module: set(true, "foo")})

    test("works with --reporter",
        "--reporter foo",
        {reporter: set(true, ["foo"])})

    test("works with -R",
        "-R foo",
        {reporter: set(true, ["foo"])})

    const my = path.join("my-test", "**", "*.js")
    const other = path.join("other-test", "**", "*.js")

    test("works with file arguments",
        `${my} ${other}`,
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, other]),
        })

    test("works with rest files with invalid options",
        `${my} -- --weird-file.js`,
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, "--weird-file.js"]),
        })

    test("works with rest files with valid options",
        `${my} -- --module`,
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, "--module"]),
        })

    // Note: this is a slightly flaky test.
    test("ignores invalid options", "--why -AM -i --here", {})
})
