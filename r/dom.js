"use strict"

/**
 * Note: do *not* assume the DOM is ready, or even that one even exists, because
 * both the tests and users may need to load mocks before initializing this
 * reporter. You may only rely on the `window` object from the options.
 */

// TODO: add before/after hooks for better integration (e.g. with `only`).

var Promise = require("bluebird")
var m = require("../lib/messages.js")
var R = require("../lib/reporter/index.js")
var getType = require("../lib/util.js").getType

function forEach(list, func, inst) {
    for (var i = 0; i < list.length; i++) func.call(inst, list[i])
}

function forOwn(object, func) {
    var keys = Object.keys(object)

    for (var i = 0; i < keys.length; i++) {
        func(object[keys[i]], keys[i])
    }
}

function Tree(name) {
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

function t(opts, text) {
    return opts.window.document.createTextNode(text)
}

function n(opts, type, attrs, children) {
    var node = opts.window.document.createElement(type)

    forOwn(attrs.style, function (value, key) { node.style[key] = value })
    forOwn(attrs, function (value, key) {
        if (key !== "style") {
            if (key in node) node[key] = value
            else node.setAttribute(key, value)
        }
    })
    forEach(children, node.appendChild, node)

    return node
}

function unhide(root) {
    forEach(root.getElementsByClassName("suite hidden"), function (suite) {
        suite.className = suite.className
            .replace(/\bhidden\b/g, "")
            .replace(/\s+/g, " ")
            .trim()
    })
}

function hideSuitesWithout(root, className) {
    forEach(root.getElementsByClassName("suite"), function (suite) {
        if (!suite.getElementsByClassName(className).length &&
                !/\bhidden\b/.test(suite)) {
            suite.className += " hidden"
        }
    })
}

function setText(element, contents) {
    if (element.textContent) element.textContent = contents
    else element.innerText = contents
}

function addToggle(state, opts, name, pass) {
    var label = n(opts, "em", {}, [t(opts, "0")])

    state.base.appendChild(n(opts, "li", {}, [
        n(opts, "a", {
            href: "javascript:void 0", // eslint-disable-line no-script-url
            onclick: function (e) {
                e.preventDefault()
                unhide(opts.root)
                if (pass) {
                    state.report.className = state.report.className
                        .replace(/\bfail\b/g, " pass")
                        .replace(/\s+/g, " ").trim()
                    if (state.report.className) hideSuitesWithout("test pass")
                } else {
                    state.report.className = state.report.className
                        .replace(/\bpass\b/g, " fail")
                        .replace(/\s+/g, " ").trim()
                    if (state.report.className) hideSuitesWithout("test fail")
                }
            },
        }, [name]),
        t(opts, " "), label,
    ]))
    return label
}

function addDuration(state, opts) {
    var counter = n(opts, "em", {}, [t(opts, "0")])

    state.base.appendChild(n(opts, "li", {}, [t(opts, "duration: "), counter]))
    return counter
}

function getRoot(opts) {
    if (opts.root == null) {
        return opts.window.document.getElementById("tl")
    } else if (typeof opts.root === "string") {
        return opts.window.document.getElementById(opts.root)
    } else if (opts.root instanceof opts.window.Element) {
        return opts.root
    } else {
        throw new TypeError(m("type.reporter.dom.element", getType(opts.root)))
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

function waitForRepaint(r) {
    return new Promise(function (resolve) { onNextRepaint(r, resolve) })
}

var reporter = R.on({
    accepts: ["root", "inst", "window", "reset"],
    Reporter: function (args, methods) {
        var opts = args.opts != null ? args.opts : {}

        if (typeof opts === "string" ||
                global.window && global.window.Element &&
                    opts instanceof global.window.Element) {
            opts = {root: opts}
        }

        opts.root = getRoot(opts)
        opts.inst = args.inst
        opts.window = args.window != null ? args.window : global.window

        return new R.Reporter(Tree, opts, methods)
    },

    // Clear the div first.
    init: function (state, opts) {
        state.error = n(opts, "div", {className: "error hidden"}, [])
        state.report = n(opts, "ul", {className: "report"}, [])
        state.base = n(opts, "ul", {className: "base"}, [])

        state.passes = addToggle(state, opts, "passes:", true)
        state.failures = addToggle(state, opts, "failures:", false)
        state.duration = addDuration(state, opts)

        opts.root.appendChild(n(opts, "iframe", {
            style: {
                width: "100%",
                height: "100%",
                border: "0",
                padding: "0",
                margin: "0",
            },
        }, [
            state.base,
            state.report,
        ]))
    },

    // Override the default which sets console colors (not applicable to DOM).
    before: function () { return Promise.resolve() },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function () { return waitForRepaint() },

    start: function (r, ev) {
        if (ev.path.length) {
            var stack = []

            forEach(ev.path, function (entry) {
                var children = r.get(stack).node = n(r.opts, "ul")

                stack.push(entry)
                r.get(stack).node.appendChild(n(r.opts, "li", {
                    className: "suite",
                }, [
                    n(r.opts, "h1", {}, [t(r.opts, entry.name)]),
                    children,
                ]))
            })
        } else {
            r.state.report.appendChild(r.get([]).node = n(r.opts, "ul"))
        }
    },

    enter: function (r, ev) {
        var children = r.get(ev.path).node = n(r.opts, "ul")
        var name = ev.path.pop().name

        r.get(ev.path).node.appendChild(n(r.opts, "li", {}, [
            n(r.opts, "h1", {}, [t(r.opts, name)]),
            children,
        ]))
    },

    // Nothing to do
    leave: function () {},

    pass: function (r, ev) {
        var name = ev.path.pop().name
        var className = "test pass " + R.speed(ev)

        r.get(ev.path).node.appendChild(n(r.opts, "li", {
            className: className,
        }, [
            n(r.opts, "h2", {}, [
                t(r.opts, name),
                n(r.opts, "span", {}, [t(r.opts, R.formatTime(ev.duration))]),
            ]),
        ]))

        updateStats(r)
    },

    fail: function () {},
    skip: function () {},

    extra: function () {},

    end: function () { return waitForRepaint() },
    error: function (r, ev) {
        if (r.opts.window.console) {
            var console = r.opts.window.conosle

            if (console.error) console.error(ev.value)
            else if (console.log) console.log(ev.value)
            else onNextRepaint(r, function () { throw ev.value })
        } else {
            onNextRepaint(r, function () { throw ev.value })
        }
    },
})

module.exports = function (opts) {
    if (R.isReport(opts)) {
        throw new TypeError(m("type.reporter.argument"))
    }

    return function (t) {
        t.reporter(reporter({inst: t, opts: opts}))
    }
}

module.exports.reporter = reporter
