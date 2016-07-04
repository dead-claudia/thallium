/* eslint-env node */
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

let counter = 0
let tests = 0
let pass = 0
let fail = 0
let skip = 0

function reset() {
    counter = 0
    tests = 0
    pass = 0
    fail = 0
    skip = 0
}

function joinPath(ev) {
    return ev.path.map(i => i.name).join(" ")
}

function template(ev, tmpl, skip) {
    if (!skip) counter++

    console.log(tmpl.replace(/%c/g, counter)
                    .replace(/%p/g, joinPath(ev).replace(/\$/g, "$$$$")))
}

function printLines(value, skipFirst) {
    const lines = value.replace(/^/gm, "    ").split(/\r?\n/g)

    for (const line of skipFirst ? lines.slice(1) : lines) {
        console.log(line)
    }
}

function printRaw(key, str) {
    if (str.length > windowWidth - key.length || /\r?\n|[:?-]/.test(str)) {
        console.log(`  ${key}: |-`)
        printLines(str, false)
    } else {
        console.log(`  ${key}: ${str}`)
    }
}

function printError({value: err}) {
    if (!(err instanceof Error)) {
        printRaw("value", inspect(err))
    } else if (err.name !== "AssertionError") {
        // Let's *not* depend on the constructor being Thallium's...
        console.log("  stack: |-")
        printLines(err.stack, false)
    } else {
        printRaw("expected", inspect(err.expected))
        printRaw("actual", inspect(err.actual))
        printRaw("message", err.message)
        console.log("  stack: |-")

        const message = err.message

        err.message = ""
        printLines(err.stack, true)
        err.message = message
    }
}

export default function tap(ev, done) { // eslint-disable-line max-statements
    if (ev.start()) {
        console.log("TAP version 13")
    } else if (ev.enter()) {
        tests++
        pass++
        // Print a leading comment, to make some TAP formatters prettier.
        template(ev, "# %p", true)
        template(ev, "ok %c")
    } else if (ev.leave()) {
        // This is meaningless for the output.
    } else if (ev.pass()) {
        tests++
        pass++
        template(ev, "ok %c %p")
    } else if (ev.fail()) {
        tests++
        fail++
        template(ev, "not ok %c %p")
        console.log("  ---")
        printError(ev)
        console.log("  ...")
    } else if (ev.skip()) {
        skip++
        template(ev, "ok %c # skip %p")
    } else if (ev.extra()) {
        template(ev, "not ok %c %p # extra")
        console.log("  ---")
        printRaw("count", inspect(ev.value.count))
        printRaw("value", inspect(ev.value.value))
        console.log("  ...")
    } else if (ev.end()) {
        console.log(`1..${counter}`)
        console.log(`# tests ${tests}`)
        if (pass) console.log(`# pass ${pass}`)
        if (fail) console.log(`# fail ${fail}`)
        if (skip) console.log(`# skip ${skip}`)
        reset()
    } else if (ev.error()) {
        console.log("Bail out!")
        console.log("  ---")
        printError(ev)
        console.log("  ...")
        reset()
    } else {
        throw new Error("unreachable")
    }

    return done()
}
