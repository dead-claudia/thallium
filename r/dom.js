"use strict"

// TODO: make a stylesheet for this

/**
 * Note: do *not* assume the DOM is ready, or even that one even exists, because
 * both the tests and users may need to load mocks before initializing this
 * reporter. You may only rely on the `window` object from the options.
 */

var Promise = require("bluebird")
var m = require("../lib/messages.js")
var R = require("../lib/reporter.js")
var getType = require("../lib/util.js").getType

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

function updateStats(r) {
    setText(r.state.passes, r.passes)
    setText(r.state.failures, r.failures)
    setText(r.state.duration, R.formatTime(r.duration))
}

function onNextRepaint(r, callback) {
    if (r.opts.window.requestAnimationFrame) {
        r.opts.window.requestAnimationFrame(callback)
    } else if (global.setTimeout) {
        global.setTimeout(callback, 0)
    } else {
        r.opts.window.setTimeout(callback, 0)
    }
}

function initRoot(r, ev) {
    var document = r.state.window.document

    if (!ev.path.length) {
        r.get([]).node = document.createElement("ul")
        r.state.report.appendChild(r.get([]).node)
        return
    }

    var stack = []

    for (var i = 0; i < ev.path.length; i++) {
        var entry = ev.path[i]
        var children = document.createElement("ul")

        r.get(stack).node = children
        stack.push(entry)

        var suite = document.createElement("li")
        var header = document.createElement("h1")

        suite.className = "suite"
        suite.appendChild(header)
        header.appendChild(document.createTextNode(entry.name))
        header.appendChild(children)

        r.get(stack).node.appendChild(suite)
    }
}

function showTestResult(r, ev) {
    var document = r.state.window.document
    var className = ev.enter() ? "" : "test " + ev.type()
    var name = ev.path[ev.path.length - 1].name
    var outer = document.createElement("li")
    var inner = document.createElement(ev.enter() ? "h1" : "h2")

    inner.appendChild(document.createTextNode(name))

    if (!ev.skip()) {
        className += " " + R.speed(ev)
        var duration = document.createElement("span")

        duration.appendChild(document.createTextNode(R.formatTime(ev.duration)))
        inner.appendChild(duration)
    }

    outer.className = className
    outer.appendChild(inner)

    if (ev.enter()) {
        r.get(ev.path).node = document.createElement("ul")
        outer.appendChild(r.get(ev.path).node)
    }

    ev.path.pop()
    r.get(ev.path).node.appendChild(outer)
}

module.exports = R.on({
    accepts: ["root", "style", "window", "reset"],
    create: function (args, methods) {
        // This is the default style and window
        var style = "./node_modules/thallium/thallium.css"
        var window = global.window
        var root = getRoot(args, window)
        var reset = function () {} // eslint-disable-line func-style

        if (root == null && typeof args === "object" && args !== null) {
            if (args.style != null) style = args.style
            if (args.window != null) window = args.window
            if (args.reset != null) reset = args.reset
            root = getRoot(args.root, window)
        }

        if (root == null) {
            throw new TypeError(m("type.reporter.dom.element", getType(root)))
        }

        return new R.Reporter(Tree,
            {window: window, root: root, style: style, reset: reset},
            methods)
    },

    init: function (state, opts) { // eslint-disable-line max-statements
        // Clear the element first.
        while (opts.root.firstChild) {
            opts.root.removeChild(opts.root.firstChild)
        }

        // Build the initial tree in a detached iframe, so the browser isn't
        // queuing repaints or numerous other calculations.
        var iframe = opts.window.document.createElement("iframe")
        var document = iframe.contentWindow.document
        var style = document.createElement("style")

        state.window = iframe.contentWindow
        style.rel = "stylesheet"
        style.src = opts.style
        document.head.appendChild(style)

        state.error = document.createElement("div")
        state.error.className = "error hidden"

        state.report = document.createElement("ul")
        state.report.className = "report"

        state.base = document.createElement("ul")
        state.base.className = "base"

        state.passes = addToggle(state, "passes:", true)
        state.failures = addToggle(state, "failures:", false)
        state.duration = addDuration(state)

        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "0"
        iframe.style.padding = "0"
        iframe.style.margin = "0"
        document.body.appendChild(state.base)
        document.body.appendChild(state.report)

        // Lastly, append the iframe to the root.
        opts.root.appendChild(iframe)
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function (r) {
        return new Promise(function (resolve) { onNextRepaint(r, resolve) })
    },

    report: function (r, ev) {
        if (ev.start()) {
            initRoot(r, ev)
        } else if (ev.enter() || ev.pass() || ev.fail() || ev.skip()) {
            showTestResult(r, ev)
            updateStats(r)
        } else if (ev.extra()) {
            // TODO
            // r.get(ev.path).status = R.Status.Failing
            //
            // var child = r.get(ev.path).node
            // var parent = r.get(ev.path.slice(0, -1)).node
            //
            // child.className = child.className.replace(/\bpass\b/g, "fail")
        } else if (ev.error()) {
            if (r.opts.window.console) {
                var console = r.opts.window.conosle

                if (console.error) console.error(ev.value)
                else if (console.log) console.log(ev.value)
                else onNextRepaint(r, function () { throw ev.value })
            } else {
                onNextRepaint(r, function () { throw ev.value })
            }
        }
    },
})
