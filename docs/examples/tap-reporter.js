"use strict"

// This is a basic TAP-generating reporter.

const tty = require("tty")
const inspect = require("util").inspect

const windowWidth = (() => {
    if (tty.isatty(1) && tty.isatty(2)) {
        if (process.stdout.columns != null) {
            return process.stdout.columns
        } else if (process.stdout.getWindowSize != null) {
            return process.stdout.getWindowSize(1)[0]
        } else if (tty.getWindowSize != null) {
            return tty.getWindowSize()[1]
        }
    }

    return 75
})()

const eol = process.platform === "win32" ? "\r\n" : "\n"

function print(text) {
    return new Promise((resolve, reject) => {
        process.stdout.write(text + eol, err => {
            return err != null ? reject(err) : resolve()
        })
    })
}

function joinPath(report) {
    return report.path.map(i => i.name).join(" ")
}

function printLines(value, skipFirst) {
    const lines = value.replace(/^/gm, "    ").split(/\r?\n/g)
    const rest = skipFirst ? lines.slice(1) : lines

    return rest.reduce(
        (p, line) => p.then(() => print(line)),
        Promise.resolve())
}

function printRaw(key, str) {
    if (str.length > windowWidth - key.length || /\r?\n|[:?-]/.test(str)) {
        return print(`  ${key}: |-`)
        .then(() => printLines(str, false))
    } else {
        return print(`  ${key}: ${str}`)
    }
}

function printError(report) {
    const err = report.error

    if (!(err instanceof Error)) {
        return printRaw("value", inspect(err))
    } else if (err.name !== "AssertionError") {
        // Let's *not* depend on the constructor being Thallium's...
        return print("  stack: |-")
        .then(() => printLines(err.stack, false))
    } else {
        return printRaw("expected", inspect(err.expected))
        .then(() => printRaw("actual", inspect(err.actual)))
        .then(() => printRaw("message", err.message))
        .then(() => print("  stack: |-"))
        .then(() => {
            const message = err.message

            err.message = ""
            return printLines(err.stack, true)
            .then(() => { err.message = message })
        })
    }
}

function fixHooks(joined, report) {
    if (!report.hook) return joined
    if (!report.name) return `${joined} (${report.stage})`
    return `${joined} (${report.stage} ‒ ${report.name})`
}

let counter = 0
let tests = 0
let pass = 0
let fail = 0
let skip = 0

function template(report, tmpl, skip) {
    if (!skip) counter++
    const joined = joinPath(report).replace(/\$/g, "$$$$")

    return print(
        tmpl.replace(/%c/g, counter)
            .replace(/%p/g, fixHooks(joined, report)))
}

module.exports = report => { // eslint-disable-line max-statements
    if (report.isStart) {
        counter = tests = pass = fail = skip = 0
        return print("TAP version 13")
    } else if (report.isEnter) {
        tests++
        pass++
        // Print a leading comment, to make some TAP formatters prettier.
        return template(report, "# %p", true)
        .then(() => template(report, "ok %c"))
    } else if (report.isPass) {
        tests++
        pass++
        return template(report, "ok %c %p")
    } else if (report.isFail || report.isHook) {
        tests++
        fail++
        return template(report, "not ok %c %p")
        .then(() => print("  ---"))
        .then(() => printError(report))
        .then(() => print("  ..."))
    } else if (report.isSkip) {
        skip++
        return template(report, "ok %c # skip %p")
    } else if (report.isEnd) {
        let p = print(`1..${counter}`)
        .then(() => print(`# tests ${tests}`))

        if (pass) p = p.then(() => print(`# pass ${pass}`))
        if (fail) p = p.then(() => print(`# fail ${fail}`))
        if (skip) p = p.then(() => print(`# skip ${skip}`))
        return p
    } else if (report.isError) {
        return print("Bail out!")
        .then(() => print("  ---"))
        .then(() => printError(report))
        .then(() => print("  ..."))
    } else {
        return undefined
    }
}
