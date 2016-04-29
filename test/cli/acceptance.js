"use strict"

const Promise = require("bluebird")
const path = require("path")
const t = require("../../index.js")
const cp = require("child_process")
const fixture = require("../../test-util/cli.js").fixture

describe.skip("cli acceptance", () => {
    const binary = path.resolve(__dirname, "../../bin/_techtonic.js")

    function test(name, opts) {
        (opts.skip ? it.skip : it)(name, () => {
            let args = opts.args

            if (typeof args === "string") {
                args = args.trim()
                args = args ? args.split(/\s+/g) : []
            }

            args.unshift(binary)

            const expected = opts.messages.trim()
                .split(/\r\n?|\n/g)
                .map(x => x.trim())
                .join("\n")

            console.log(process.argv[0])
            console.log(args)

            const child = cp.spawn(process.argv[0], args, {
                stdio: ["inherit", "pipe", "inherit"],
            })

            let output = ""

            child.stdout.setEncoding("utf-8")
            child.stdout.on("data", data => output += data)

            return Promise.all([
                new Promise((resolve, reject) => {
                    child.on("error", reject)
                    child.stdout.on("error", reject)
                    child.stdout.on("end", resolve)
                }),
                new Promise((resolve, reject) => {
                    child.on("close", (code, signal) => {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error(`terminated with signal ${signal}`))
                    })
                }),
                new Promise((resolve, reject) => {
                    child.on("exit", (code, signal) => {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error(`terminated with signal ${signal}`))
                    })
                }),
            ])
            .then(list => {
                const code = list[1] != null ? list[1] : list[2]

                t.equal(code, opts.code)
                t.equal(output, expected)
            })
        })
    }

    test("runs simple valid tests", {
        // skip: true,
        args: `--cwd ${fixture("acceptance/simple")}`,
        code: 0,
        messages: `
            start = undefined
            start [0: test 1] = undefined
            end [0: test 1] = undefined
            pass [0: test 1] = undefined
            start [1: test 2] = undefined
            end [1: test 2] = undefined
            pass [1: test 2] = undefined
            end = undefined
            exit = undefined
        `,
    })

    test("runs moderately sized test suites", {
        skip: true,
        args: `--cwd ${fixture("acceptance")} full-js/**`,
        code: 1,
        messages: `
start = undefined
start [0: mod-one] = undefined
start [0: mod-one] > [0: 1 === 1] = undefined
end [0: mod-one] > [0: 1 === 1] = undefined
pass [0: mod-one] > [0: 1 === 1] = undefined
start [0: mod-one] > [1: foo()] = undefined
end [0: mod-one] > [1: foo()] = undefined
fail [0: mod-one] > [1: foo()] = "AssertionError: Expected 1 to not equal 1"
start [0: mod-one] > [2: bar()] = undefined
end [0: mod-one] > [2: bar()] = undefined
fail [0: mod-one] > [2: bar()] = "Error: fail"
start [0: mod-one] > [3: baz()] = undefined
end [0: mod-one] > [3: baz()] = undefined
fail [0: mod-one] > [3: baz()] = "Error: sentinel"
start [0: mod-one] > [4: nested] = undefined
start [0: mod-one] > [4: nested] > [0: nested 2] = undefined
end [0: mod-one] > [4: nested] > [0: nested 2] = undefined
pass [0: mod-one] > [4: nested] > [0: nested 2] = undefined
end [0: mod-one] > [4: nested] = undefined
pass [0: mod-one] > [4: nested] = undefined
end [0: mod-one] = undefined
pass [0: mod-one] = undefined
start [1: mod-two] = undefined
start [1: mod-two] > [0: 1 === 2] = undefined
end [1: mod-two] > [0: 1 === 2] = undefined
fail [1: mod-two] > [0: 1 === 2] = "AssertionError: Expected 1 to equal 2"
start [1: mod-two] > [1: expandos don't transfer] = undefined
end [1: mod-two] > [1: expandos don't transfer] = undefined
pass [1: mod-two] > [1: expandos don't transfer] = undefined
start [1: mod-two] > [2: what a fail...] = undefined
end [1: mod-two] > [2: what a fail...] = undefined
fail [1: mod-two] > [2: what a fail...] = "Expected 'yep' to be a nope"
end [1: mod-two] = undefined
pass [1: mod-two] = undefined
end = undefined
exit = undefined
        `,
    })
})
