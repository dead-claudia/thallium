import * as path from "path"

import t from "../../../src/index.js"
import {parseArgs} from "../../../src/cli/parse-args.js"
import ArgumentError from "../../../src/cli/argument-error.js"

// Pull it out to safely wrap.
const test1 = test

suite("cli arguments (subarg)", () => { // eslint-disable-line max-statements
    function set(set, value) {
        return {set, value}
    }

    function throws(description, str) {
        str = /^\s+$/.test(str) ? [] : str.split(/\s+/g)
        test1(description, () => {
            t.throws(() => parseArgs("base", str), ArgumentError)
        })
    }

    // This is a nice DSL.
    function test(description, str, result) {
        str = /^\s+$/.test(str) ? [] : str.split(/\s+/g)

        const list = Object.keys(result).map(key => {
            return {module: key, args: result[key]}
        })

        test1(description, () => {
            t.deepEqual(parseArgs("base", str), {
                config: set(false, null),
                module: set(false, "techtonic"),
                cwd: set(false, "base"),
                register: set(false, []),
                files: set(false, [path.join("test", "**")]),
                reporters: set(true, list),
                help: null,
            })
        })
    }

    throws("fails with unbalanced brackets", "--reporter [ foo")
    throws("fails with subarg in flag position", "--reporter [ foo ] [ bar ]")
    throws("fails with subarg in value position", "--cwd [ bar ]")
    throws("fails with subarg in initial position", "[ bar ]")
    throws("fails with subarg in flag position after boolean", "--help [ bar ]")

    test("works with nothing", "--reporter [ foo ]", {foo: []})

    test("works with a single object with boolean",
        "--reporter [ foo --bar ]",
        {foo: [{bar: true}]})

    test("works with a single object with value",
        "--reporter [ foo --bar value ]",
        {foo: [{bar: "value"}]})

    test("works with a single object with value + boolean",
        "--reporter [ foo --bar value --bool ]",
        {foo: [{bar: "value", bool: true}]})

    test("works with a single object with value + value",
        "--reporter [ foo --bar value --baz other ]",
        {foo: [{bar: "value", baz: "other"}]})

    test("works with a single object with boolean + value",
        "--reporter [ foo --bar --baz other ]",
        {foo: [{bar: true, baz: "other"}]})

    function numeric(name, string, number) {
        test(`works with a single object with ${name} value`,
            `--reporter [ foo --bar ${string} ]`,
            {foo: [{bar: number}]})

        test(`works with a single string with ${name} value`,
            `--reporter [ foo ${string} ]`,
            {foo: [number]})
    }

    numeric("bare lowercase binary", "0b1101", 13)
    numeric("bare uppercase binary", "0B1101", 13)
    numeric("bare lowercase octal", "0o755", 493)
    numeric("bare uppercase octal", "0O755", 493)
    numeric("bare lowercase hex", "0xf00face", 0xf00face)
    numeric("bare uppercase hex", "0XF00FACE", 0xf00face)
    numeric("bare mixed hex", "0Xf00fACE", 0xf00face)
    numeric("positive lowercase binary", "+0b1101", 13)
    numeric("positive uppercase binary", "+0B1101", 13)
    numeric("positive lowercase octal", "+0o755", 493)
    numeric("positive uppercase octal", "+0O755", 493)
    numeric("positive lowercase hex", "+0xf00face", 0xf00face)
    numeric("positive uppercase hex", "+0XF00FACE", 0xf00face)
    numeric("positive mixed hex", "+0Xf00fACE", 0xf00face)
    numeric("negative lowercase binary", "-0b1101", -13)
    numeric("negative uppercase binary", "-0B1101", -13)
    numeric("negative lowercase octal", "-0o755", -493)
    numeric("negative uppercase octal", "-0O755", -493)
    numeric("negative lowercase hex", "-0xf00face", -0xf00face)
    numeric("negative uppercase hex", "-0XF00FACE", -0xf00face)
    numeric("negative mixed hex", "-0Xf00fACE", -0xf00face)
    numeric("small bare integer", "12345", 12345)
    numeric("small positive integer", "+12345", +12345)
    numeric("small negative integer", "-12345", -12345)
    numeric("bare integer", "1234567890", 1234567890)
    numeric("positive integer", "+1234567890", +1234567890)
    numeric("negative integer", "-1234567890", -1234567890)
    numeric("bare double-size integer", "12345678901234567890", 12345678901234567890) // eslint-disable-line max-len
    numeric("positive double-size integer", "+12345678901234567890", +12345678901234567890) // eslint-disable-line max-len
    numeric("negative double-size integer", "-12345678901234567890", -12345678901234567890) // eslint-disable-line max-len
    numeric("bare double", "12.34", 12.34)
    numeric("positive double", "+12.34", +12.34)
    numeric("negative double", "-12.34", -12.34)
    numeric("bare integer with decimal point", "12.", 12)
    numeric("positive integer with decimal point", "+12.", +12)
    numeric("negative integer with decimal point", "-12.", -12)
    numeric("bare integer + lowercase exponent", "12e4", 12e4)
    numeric("bare integer + uppercase exponent", "12E4", 12E4)
    numeric("positive integer + lowercase exponent", "+12e4", +12e4)
    numeric("positive integer + uppercase exponent", "+12E4", +12E4)
    numeric("negative integer + lowercase exponent", "-12e4", -12e4)
    numeric("negative integer + uppercase exponent", "-12E4", -12E4)
    numeric("bare integer + decimal + lowercase exponent", "12.e4", 12e4)
    numeric("bare integer + decimal + uppercase exponent", "12.E4", 12E4)
    numeric("positive integer + decimal + lowercase exponent", "+12.e4", +12e4)
    numeric("positive integer + decimal + uppercase exponent", "+12.E4", +12E4)
    numeric("negative integer + decimal + lowercase exponent", "-12.e4", -12e4)
    numeric("negative integer + decimal + uppercase exponent", "-12.E4", -12E4)
    numeric("bare double + lowercase exponent", "12.34e4", 12.34e4)
    numeric("bare double + uppercase exponent", "12.34E4", 12.34E4)
    numeric("positive double + lowercase exponent", "+12.34e4", +12.34e4)
    numeric("positive double + uppercase exponent", "+12.34E4", +12.34E4)
    numeric("negative double + lowercase exponent", "-12.34e4", -12.34e4)
    numeric("negative double + uppercase exponent", "-12.34E4", -12.34E4)

    test("works with a single object with several things",
        "--reporter [ techtonic/r/console --color --tee output.txt --good * --bad - --hide-pending ]", // eslint-disable-line max-len
        {"techtonic/r/console": [{
            "color": true,
            "tee": "output.txt",
            "good": "*",
            "bad": "-",
            "hide-pending": true,
        }]})

    test("works with string value",
        "--reporter [ foo bar ]",
        {foo: ["bar"]})

    for (const item of [true, false, null]) {
        test(`works with \`${item}\` value`,
            `--reporter [ foo ${item} ]`,
            {foo: [item]})

        test(`works with \`${item}\` object value`,
            `--reporter [ foo --bar ${item} ]`,
            {foo: [{bar: item}]})
    }

    test("works with multiple subargs with no extra args",
        "--reporter [ foo ] --reporter [ bar ]",
        {foo: [], bar: []})

    test("does not nest subargs",
        "--reporter [ foo --bar [ baz ]",
        {foo: [{bar: "["}, "baz"]})

    test("works with multiple seriously complicated subargs",
        `--reporter [ foo
            --bool true
            file.js
            --input -
            --whatever
            --
            --not-an-option
            nope.txt
            what?!? ]
        --reporter [ bar --hi --bye -- !**/file.txt ]`,
        {
            foo: [
                {bool: true},
                "file.js",
                {input: "-", whatever: true},
                ["--not-an-option", "nope.txt", "what?!?"],
            ],
            bar: [{hi: true, bye: true}, "!**/file.txt"],
        })
})
