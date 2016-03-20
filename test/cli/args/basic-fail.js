import t from "../../../src/index.js"
import {parseArgs} from "../../../src/cli/parse-args.js"
import ArgumentError from "../../../src/cli/argument-error.js"

suite("cli arguments (subarg)", () => {
    function throws(str) {
        const args = /^\s+$/.test(str) ? [] : str.split(/\s+/g)

        test(`fails with missing argument for ${str}`, () => {
            t.throws(() => parseArgs("base", args), ArgumentError)
        })
    }

    throws("-c")
    throws("--config")
    throws("--cwd")
    throws("-m")
    throws("--module")
    throws("-r")
    throws("--register")
    throws("-R")
    throws("--reporter")

    throws("-c --")
    throws("--config --")
    throws("--cwd --")
    throws("-m --")
    throws("--module --")
    throws("-r --")
    throws("--register --")
    throws("-R --")
    throws("--reporter --")
})
