/* eslint-env node */
// Remove after this hits npm: https://github.com/eslint/eslint/pull/7175
/* eslint no-unused-expressions: 0 */

// This is a basic TAP-generating reporter.

import * as tty from "tty"
import {inspect} from "util"

const windowWidth = (() => {
    if (tty.isatty(1) && tty.isatty(2)) {
        if (process.stdout.columns) {
            return process.stdout.columns
        } else if (process.stdout.getWindowSize) {
            return process.stdout.getWindowSize(1)[0]
        } else if (tty.getWindowSize) {
            return tty.getWindowSize()[1]
        }
    }

    return 75
})()

function print(text) {
    return new Promise((resolve, reject) => {
        process.stdout.write(text, err => err != null ? reject(err) : resolve())
    })
}

let counter, tests, pass, fail, skip

reset()
function reset() {
    counter = tests = pass = fail = skip = 0
}

function joinPath(ev) {
    return ev.path.map(i => i.name).join(" ")
}

function template(ev, tmpl, skip) {
    if (!skip) counter++

    return print(
        tmpl.replace(/%c/g, counter)
            .replace(/%p/g, joinPath(ev).replace(/\$/g, "$$$$")))
}

async function printLines(value, skipFirst) {
    const lines = value.replace(/^/gm, "    ").split(/\r?\n/g)

    for (const line of skipFirst ? lines.slice(1) : lines) {
        await print(line)
    }
}

async function printRaw(key, str) {
    if (str.length > windowWidth - key.length || /\r?\n|[:?-]/.test(str)) {
        await print(`  ${key}: |-`)
        await printLines(str, false)
    } else {
        await print(`  ${key}: ${str}`)
    }
}

async function printError({value: err}) {
    if (!(err instanceof Error)) {
        await printRaw("value", inspect(err))
    } else if (err.name !== "AssertionError") {
        // Let's *not* depend on the constructor being Thallium's...
        await print("  stack: |-")
        await printLines(err.stack, false)
    } else {
        await printRaw("expected", inspect(err.expected))
        await printRaw("actual", inspect(err.actual))
        await printRaw("message", err.message)
        await print("  stack: |-")

        const message = err.message

        err.message = ""
        await printLines(err.stack, true)
        err.message = message
    }
}

export default async function tap(ev) { // eslint-disable-line max-statements
    if (ev.start) {
        await print("TAP version 13")
    } else if (ev.enter) {
        tests++
        pass++
        // Print a leading comment, to make some TAP formatters prettier.
        await template(ev, "# %p", true)
        await template(ev, "ok %c")
    } else if (ev.pass) {
        tests++
        pass++
        await template(ev, "ok %c %p")
    } else if (ev.fail) {
        tests++
        fail++
        await template(ev, "not ok %c %p")
        await print("  ---")
        await printError(ev)
        await print("  ...")
    } else if (ev.skip) {
        skip++
        await template(ev, "ok %c # skip %p")
    } else if (ev.end) {
        await print(`1..${counter}`)
        await print(`# tests ${tests}`)
        if (pass) await print(`# pass ${pass}`)
        if (fail) await print(`# fail ${fail}`)
        if (skip) await print(`# skip ${skip}`)
        reset()
    } else if (ev.error) {
        await print("Bail out!")
        await print("  ---")
        await printError(ev)
        await print("  ...")
        reset()
    }
}
