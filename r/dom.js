"use strict"

/**
 * Note: do *not* assume the DOM is ready, or even that one even exists, because
 * both the tests and users may need to load mocks before initializing this
 * reporter. You may only rely on the `window` object from the options.
 */

var Promise = require("bluebird")
var m = require("../lib/messages.js")
var R = require("../lib/reporter/index.js")
var getType = require("../lib/util.js").getType

function forEach(list, func, inst) {
    for (var i = 0; i < list.length; i++) {
        func.call(inst, list[i])
    }
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

module.exports = R.on({
    accepts: ["root", "window", "reset"],
    create: function (args, methods) {
        var root = getRoot(args, global.window)
        var window = global.window

        if (root == null) {
            if (args.window != null) window = args.window
            root = getRoot(args.root, window)

            if (root == null) {
                throw new TypeError(m("type.reporter.dom.element",
                    getType(root)))
            }
        }

        return new R.Reporter(Tree,
            {window: window, root: root, reset: args.reset},
            methods)
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
    before: function () {},

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function (r) {
        return new Promise(function (resolve) { onNextRepaint(r, resolve) })
    },

    report: function (r, ev) {
        if (ev.start()) {
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
        } else if (ev.enter() || ev.pass() || ev.fail() || ev.skip()) {
            var enteredChildren = ev.enter()
                ? r.get(ev.path).node = n(r.opts, "ul")
                : undefined

            var className = ev.enter() ? "" : "test pass " + R.speed(ev)
            var name = ev.path.pop().name
            var innerChildren = [t(r.opts, name)]

            if (!ev.skip()) {
                innerChildren.push(n(r.opts, "span", {}, [
                    t(r.opts, R.formatTime(ev.duration)),
                ]))
            }

            var outerChildren = [
                n(r.opts, ev.enter() ? "h1" : "h2", {}, innerChildren),
            ]

            if (ev.enter()) outerChildren.push(enteredChildren)

            r.get(ev.path).node.appendChild(
                n(r.opts, "li", {className: className}, outerChildren))

            updateStats(r)
        } else if (ev.extra()) {
            // TODO
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
