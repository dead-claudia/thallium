"use strict"

var diff = require("diff")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var inspect = require("clean-assert-util").inspect
var hasOwn = Object.prototype.hasOwnProperty

/**
 * View logic
 */

function t(text) {
    return D.document.createTextNode(text)
}

function h(type, attrs, children) {
    var parts = type.split(/\s+/g)

    if (Array.isArray(attrs)) {
        children = attrs
        attrs = undefined
    }

    if (attrs == null) attrs = {}
    if (children == null) children = []

    type = parts[0]
    attrs.className = parts.slice(1).join(" ")

    var elem = D.document.createElement(type)

    for (var attr in attrs) {
        if (hasOwn.call(attrs, attr)) elem[attr] = attrs[attr]
    }

    for (var i = 0; i < children.length; i++) {
        if (children[i] != null) elem.appendChild(children[i])
    }

    return elem
}

function unifiedDiff(err) {
    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
        .split(/\r?\n|\r/g).slice(4)
        .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })

    while (msg.length) {
        var last = msg[msg.length - 1]

        if (/^\s*$/g.test(last)) {
            msg.pop()
        } else {
            break
        }
    }

    if (!msg.length) {
        msg.push(" (none)")
    }

    return h("div tl-diff-display", [
        h("span tl-diff-header", [
            h("span tl-diff-added", [t("+ expected")]),
            h("span tl-diff-removed", [t("- actual")]),
        ]),
    ].concat(msg.map(function (line) {
        if (line[0] === "+") {
            return h("span tl-line tl-diff-added", [t(line.trimRight())])
        } else if (line[0] === "-") {
            return h("span tl-line tl-diff-removed", [t(line.trimRight())])
        } else {
            return h("span tl-line tl-diff-none", [t(line.trimRight())])
        }
    })))
}

function formatLine(line) {
    return h("span tl-line", [t(line.trimRight())])
}

function formatFailError(e) {
    var stack = R.readStack(e)

    return h("div tl-fail-display", [
        h("div tl-fail-message",
            (e.name + ": " + e.message).split(/\r?\n|\r/g)
            .map(formatLine)
        ),
        e.name === "AssertionError" && e.showDiff !== false
            ? unifiedDiff(e) : undefined,
        stack === "" ? undefined : h("div tl-fail-stack",
            stack.split(/\r?\n|\r/g).map(formatLine)),
    ])
}

function formatInternalError(e) {
    var stack = R.readStack(e)

    return h("li tl-error", [
        h("h2", [t("Internal error")]),
        h("div tl-error-message",
            (e.name + ": " + e.message).split(/\r?\n|\r/g)
            .map(formatLine)
        ),
        !stack ? undefined : h("div tl-error-stack",
            stack.split(/\r?\n|\r/g).map(formatLine)),
    ])
}

function showTest(_, report, className, child) {
    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)
    var speed = R.speed(report)

    if (speed === "fast") {
        parent.node.appendChild(h("li " + className + " tl-" + speed, [
            h("h2", [t(name)]),
            child,
        ]))
    } else {
        parent.node.appendChild(h("li " + className + " tl-" + speed, [
            h("h2", [
                t(name + " ("),
                h("span tl-duration", [t(R.formatTime(report.duration))]),
                t(")"),
            ]),
            child,
        ]))
    }

    _.opts.duration.textContent = R.formatTime(_.duration)
}

function showSkip(_, report) {
    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)

    parent.node.appendChild(h("li tl-test tl-skip", [
        h("h2", [t(name)]),
    ]))
}

exports.report = function (_, report) {
    if (report.isStart) {
        // Clear the element first, just in case.
        while (_.opts.report.firstChild) {
            _.opts.report.removeChild(_.opts.report.firstChild)
        }

        _.get(undefined, 0).node = _.opts.report
        _.opts.duration.textContent = R.formatTime(0)
        _.opts.pass.textContent = "0"
        _.opts.fail.textContent = "0"
        _.opts.skip.textContent = "0"
    } else if (report.isEnter) {
        var child = h("ul")

        _.get(report.path).node = child
        showTest(_, report, "tl-suite tl-pass", child)
        _.opts.pass.textContent = _.pass
    } else if (report.isPass) {
        showTest(_, report, "tl-test tl-pass")
        _.opts.pass.textContent = _.pass
    } else if (report.isFail) {
        showTest(_, report, "tl-test tl-fail", formatFailError(report.error))
        _.opts.fail.textContent = _.fail
    } else if (report.isSkip) {
        showSkip(_, report)
        _.opts.skip.textContent = _.skip
    } else if (report.isError) {
        _.opts.report.appendChild(formatInternalError(report.error))
    }
}

function makeCounter(report, child, label, name) {
    return h("button tl-toggle", {
        onclick: function (ev) {
            ev.preventDefault()
            ev.stopPropagation()

            var classList = report.classList

            if (classList != null) {
                classList.remove("tl-pass")
                classList.remove("tl-fail")
                classList.remove("tl-skip")
                classList.add(name)
            } else {
                report.className = report.className
                    .replace(/\btl-(pass|fail|skip)\b/g, "")
                    .replace(/\s+/g, " ")
                    .trim() + " " + name
            }
        },
    }, [t(label), child])
}

exports.initState = function (opts) {
    // <div class="tl-header">
    //   <div class="tl-label">Duration:<em>{{duration}}</em></div>
    //   <button class="tl-toggle">Passes:<em>{{pass}}</em></button>
    //   <button class="tl-toggle">Failures:<em>{{fail}}</em></button>
    //   <button class="tl-toggle">Skipped:<em>{{skip}}</em></button>
    //   <button class="tl-run">Run</button>
    // </div>
    // <ul class="tl-report"></ul>

    var state = {
        duration: h("em", [t(R.formatTime(0))]),
        pass: h("em", [t("0")]),
        fail: h("em", [t("0")]),
        skip: h("em", [t("0")]),
        report: h("ul tl-report"),
    }

    var header = h("div tl-header", [
        h("div tl-label", [t("Duration:"), state.duration]),
        makeCounter(state.report, state.pass, "Passes:", "tl-pass"),
        makeCounter(state.report, state.fail, "Failures:", "tl-fail"),
        makeCounter(state.report, state.skip, "Skipped:", "tl-skip"),
        h("button tl-run", {
            onclick: function (ev) {
                ev.preventDefault()
                ev.stopPropagation()
                runTests(opts, state)
            },
        }, [t("Run")]),
    ])

    var root = D.document.getElementById("tl")

    if (root == null) {
        D.document.body.appendChild(h("div", {id: "tl"}, [
            header,
            state.report,
        ]))
    } else {
        // Clear the element first, just in case.
        while (root.firstChild) root.removeChild(root.firstChild)
        root.appendChild(header)
        root.appendChild(state.report)
    }

    return state
}
