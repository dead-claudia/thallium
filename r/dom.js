"use strict"

var R = require("../lib/reporter/index")
var getType = require("../lib/util").getType

// TODO: make a stylesheet for this
var styles = [
    // Each entry is either a string or array of strings.
]

function injectStyle(document) {
    // Just injecting a good old <style> element.
    var style = document.createElement("style")
    var css = ""

    for (var i = 0; i < styles.length; i++) {
        if (Array.isArray(styles[i])) {
            css += styles[i].join("\n")
        } else {
            css += styles[i]
        }
    }

    style.type = "text/css"

    if (style.styleSheet) {
        style.styleSheet.cssText = css
    } else {
        style.appendChild(document.createTextNode(css))
    }

    document.head.appendChild(style)
}

/**
 * Note: do *not* assume the DOM is ready, or even that one even exists, because
 * both the tests and users may need to load mocks before initializing this
 * reporter. You may only rely on the `window` object from the options.
 */

function Tree(name) {
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

function unhide(document) {
    var suites = document.getElementsByClassName("suite hidden")

    for (var i = 0; i < suites.length; i++) {
        suites[i].className = suites[i].className
            .replace(/\bhidden\b/g, "")
            .replace(/\s+/g, " ")
            .trim()
    }
}

function hideSuitesWithout(document, className) {
    var suites = document.getElementsByClassName("suite")

    for (var i = 0; i < suites.length; i++) {
        var suite = suites[i]

        if (!suite.getElementsByClassName(className).length &&
                !/\bhidden\b/.test(suite)) {
            suite.className += " hidden"
        }
    }
}

function setText(element, contents) {
    if (element.textContent) element.textContent = contents
    else element.innerText = contents
}

function addToggle(state, name, pass) {
    var document = state.window.document
    var entry = document.createElement("li")
    var label = document.createElement("em")
    var link = document.createElement("a")

    entry.appendChild(link)
    link.href = "javascript:void 0" // eslint-disable-line no-script-url
    link.addEventListener("click", function (e) {
        e.preventDefault()
        unhide(state.window.document)

        if (pass) {
            state.report.className = state.report.className
                .replace(/\bfail\b/g, " pass")
                .replace(/\s+/g, " ").trim()
            if (state.report.className) {
                hideSuitesWithout(state.window.document, "test pass")
            }
        } else {
            state.report.className = state.report.className
                .replace(/\bpass\b/g, " fail")
                .replace(/\s+/g, " ").trim()
            if (state.report.className) {
                hideSuitesWithout(state.window.document, "test fail")
            }
        }
    }, false)
    link.appendChild(document.createTextNode(name))

    entry.appendChild(document.createTextNode(" "))
    entry.appendChild(label)
    label.appendChild(document.createTextNode("0"))
    state.base.appendChild(entry)
    return label
}

function addDuration(state) {
    var document = state.window.document
    var entry = document.createElement("li")
    var counter = document.createElement("em")

    entry.appendChild(document.createTextNode("duration: "))
    entry.appendChild(counter)
    counter.appendChild(document.createTextNode("0"))
    return counter
}

function getRoot(root, window) {
    if (root == null) {
        return window.document.getElementById("tl")
    } else if (typeof root === "string") {
        return window.document.getElementById(root)
    } else if (root instanceof window.Element) {
        return root
    } else {
        return null
    }
}

function updateStats(_) {
    setText(_.state.passes, _.passes)
    setText(_.state.failures, _.failures)
    setText(_.state.duration, R.formatTime(_.duration))
}

function onNextRepaint(_, callback) {
    if (_.opts.window.requestAnimationFrame) {
        _.opts.window.requestAnimationFrame(callback)
    } else if (global.setTimeout) {
        global.setTimeout(callback, 0)
    } else {
        _.opts.window.setTimeout(callback, 0)
    }
}

function initIframe(state, opts) {
    // Build the initial tree in a detached iframe, so the browser isn't
    // queuing repaints, etc.
    var iframe = opts.window.document.createElement("iframe")
    var document = iframe.contentWindow.document

    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "0"
    iframe.style.padding = "0"
    iframe.style.margin = "0"

    state.window = iframe.contentWindow
    injectStyle(document)

    state.error = document.createElement("div")
    state.error.className = "error hidden"

    state.report = document.createElement("ul")
    state.report.className = "report"

    state.base = document.createElement("ul")
    state.base.className = "base"

    state.passes = addToggle(state, "passes:", true)
    state.failures = addToggle(state, "failures:", false)
    state.duration = addDuration(state)

    document.body.appendChild(state.base)
    document.body.appendChild(state.report)

    return iframe
}

function initFirstTest(_, report) {
    var document = _.state.window.document

    if (!report.path.length) {
        _.get([]).node = document.createElement("ul")
        _.state.report.appendChild(_.get([]).node)
        return
    }

    var stack = []

    for (var i = 0; i < report.path.length; i++) {
        var entry = report.path[i]
        var children = document.createElement("ul")

        _.get(stack).node = children
        stack.push(entry)

        var suite = document.createElement("li")
        var header = document.createElement("h1")

        suite.className = "suite"
        suite.appendChild(header)
        header.appendChild(document.createTextNode(entry.name))
        header.appendChild(children)

        _.get(stack).node.appendChild(suite)
    }
}

function showTestResult(_, report) {
    var document = _.state.window.document
    var className = report.enter ? "" : "test " + report.type
    var name = report.path[report.path.length - 1].name
    var outer = document.createElement("li")
    var inner = document.createElement(report.enter ? "h1" : "h2")

    inner.appendChild(document.createTextNode(name))

    if (!report.skip) {
        className += " " + R.speed(report)
        var duration = document.createElement("span")

        duration.appendChild(document.createTextNode(R.formatTime(report.duration)))
        inner.appendChild(duration)
    }

    outer.className = className
    outer.appendChild(inner)

    if (report.enter) {
        _.get(report.path).node = document.createElement("ul")
        outer.appendChild(_.get(report.path).node)
    }

    report.path.pop()
    _.get(report.path).node.appendChild(outer)
}

module.exports = R.on({
    accepts: ["root", "window", "reset"],
    create: function (args, methods) {
        // This is the default window
        var window = global.window
        var root = getRoot(args, window)
        var reset = function () {} // eslint-disable-line func-style

        if (root == null && typeof args === "object" && args !== null) {
            if (args.window != null) window = args.window
            if (args.reset != null) reset = args.reset
            root = getRoot(args.root, window)
        }

        if (root == null) {
            throw new TypeError(
                "Expected `element` to be an `Element` or string ID, but " +
                "found a(n) " + getType(root))
        }

        return new R.Reporter(Tree,
            {window: window, root: root, reset: reset},
            methods)
    },

    init: function (state, opts) {
        // Clear the element first.
        while (opts.root.firstChild) {
            opts.root.removeChild(opts.root.firstChild)
        }

        opts.root.appendChild(initIframe(state, opts))
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function (_) {
        return new Promise(function (resolve) { onNextRepaint(_, resolve) })
    },

    report: function (_, report) {
        if (report.isStart) {
            initFirstTest(_, report)
        } else if (report.isEnter ||
                report.isPass ||
                report.isFail ||
                report.isSkip) {
            showTestResult(_, report)
            updateStats(_)
        } else if (report.isError) {
            if (_.opts.window.console) {
                var console = _.opts.window.conosle

                if (console.error) console.error(report.error)
                else if (console.log) console.log(report.error)
                else onNextRepaint(_, function () { throw report.error })
            } else {
                onNextRepaint(_, function () { throw report.error })
            }
        }
    },
})
