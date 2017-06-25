"use strict"

/**
 * The DOM API mock. It employs a few basic optimizations, but it implements the
 * bare minimum for the DOM reporter to be tested, including whether a node is
 * live. It does feature tree traversal abilities, to implement certain methods
 * like `querySelector`.
 *
 * Non-DOM API:
 *
 * - `Util.DOM.init(callback)` - Create a new mock based on this.
 * - `Util.DOM.it(name, body)` - Define a wrapped test that injects the mock
 *   created by `Util.DOM.init` into the global variables `window` and
 *   `document`, cleaning them up on test success and failure. Includes `skip`
 *   and `only` members for consistency.
 * - `Util.DOM.it.dom(name, body)` - Same as above, including `skip` and `only`.
 */

var methods = require("../lib/methods")
var D = require("../lib/dom/inject")
var Util = require("../lib/util")
var hasOwn = Object.prototype.hasOwnProperty

var globalDocument = global.document
var globalWindow = global.window
var hooks = {
    before: [],
    after: [],
}

var readonlyDescriptor = {
    configurable: true,
    enumerable: true,
    writable: false,
    value: undefined,
}

var hiddenDescriptor = {
    configurable: false,
    enumerable: false,
    writable: true,
    value: undefined,
}

var id = 0

function generate() {
    return id++
}

/**
 * A closure-free and mostly allocation-free tree stepper using constant space.
 * I'd like to at least stay *close* to the native TreeWalker in performance, so
 * the DOM tests don't become super slow. (The traversals aren't cached, so the
 * performance of this affects everything else.)
 *
 * The below is adapted from Blink, simplified and optimized for this
 * particular use case. Note that `prev` should start out as `=== parent`.
 */
exports.step = step
function step(parent, prev) {
    var next = prev.firstChild

    if (next != null) return next
    while (prev != null && prev !== parent) {
        next = prev.nextSibling
        if (next != null) return next
        prev = prev.parentNode
    }

    return null
}

function readonly(object, prop, value) {
    readonlyDescriptor.value = value
    Object.defineProperty(object, prop, readonlyDescriptor)
    readonlyDescriptor.value = undefined
}

function hidden(object, prop, value) {
    hiddenDescriptor.value = value
    Object.defineProperty(object, prop, hiddenDescriptor)
    hiddenDescriptor.value = undefined
}

function Node() {
    // Private marker
    this._live = false
    hidden(this, "previousSibling", null)
    hidden(this, "nextSibling", null)
    hidden(this, "parentNode", null)
}

function Event() {
    this.defaultPrevented = false
    // Non-standard, but lets me inspect better.
    this.propagationStopped = false
}

methods(Event, {
    preventDefault: function () { this.defaultPrevented = true },
    stopPropagation: function () { this.propagationStopped = true },
})

function Text(textContent) {
    Node.call(this)
    this.textContent = textContent
}

methods(Text, Node, {
    inspect: function () {
        return {
            type: "Text",
            textContent: this.textContent,
        }
    },
})

function queryClass(elem, className) {
    var child = elem

    while ((child = step(elem, child)) != null) {
        if (child instanceof Element &&
                child.className.indexOf(className) >= 0) {
            return child
        }
    }

    return null
}

function queryStyleThallium(elem) {
    var child = elem

    while ((child = step(elem, child)) != null) {
        if (child instanceof Element &&
                child.tagName === "style" &&
                hasOwn.call(child._attrs, "data-tl-style")) {
            return child
        }
    }

    return null
}

function assignMissing(target, elem) {
    for (var key in elem) {
        if (hasOwn.call(elem, key) &&
                !hasOwn.call(target, key) &&
                key !== "_live") {
            target[key] = elem[key]
        }
    }
}

var handlers

hooks.before.push(function () { handlers = Object.create(null) })
hooks.after.push(function () { handlers = undefined })

// So they aren't directly referenced by their hosts (aids in equality).
function setHandler(name, node, callback) {
    if (callback === true) return true
    if (typeof callback !== "function") callback = undefined
    var map = handlers[name]

    if (map == null) map = handlers[name] = Object.create(null)
    if (callback != null) {
        map[node._uniqueId] = callback
        return true
    } else {
        delete map[node._uniqueId]
        return false
    }
}

function getHandler(name, node, exists) {
    if (!exists) return undefined
    var map = handlers[name]

    if (map == null) return true
    var value = map[node._uniqueId]

    return value == null || value
}

function Element(tagName) {
    Node.call(this)
    readonly(this, "tagName", tagName.toUpperCase())
    hidden(this, "_uniqueId", generate())
    hidden(this, "firstChild", null)
    hidden(this, "lastChild", null)

    this._onclick = false
    this._onload = false
    this._onerror = false
    this.id = ""
    this.className = ""
    this._attrs = Object.create(null)
}

methods(Element, Node, {
    inspect: function () {
        var inspect = {
            type: "Element",
            tagName: this.tagName,
            className: this.className,
            id: this.id,
            _onclick: this._onclick,
            _onload: this._onload,
            _onerror: this._onerror,
            children: [],
        }

        var child = this.firstChild

        while (child != null) {
            inspect.children.push(child.inspect())
            child = child.nextSibling
        }

        assignMissing(inspect, this)
        return inspect
    },

    get onclick() { return getHandler("onclick", this, this._onclick) },
    set onclick(value) { this._onclick = setHandler("onclick", this, value) },

    get onload() { return getHandler("onload", this, this._onload) },
    set onload(value) { this._onload = setHandler("onload", this, value) },

    get onerror() { return getHandler("onerror", this, this._onerror) },
    set onerror(value) { this._onerror = setHandler("onerror", this, value) },

    get textContent() {
        if (this.firstChild == null) return ""

        var content = ""
        var child = this // eslint-disable-line consistent-this

        while ((child = step(this, child)) != null) {
            if (child instanceof Text) content += child.textContent
        }

        return content
    },

    set textContent(data) {
        if (this._live) {
            var child = this // eslint-disable-line consistent-this

            while ((child = step(this, child)) != null) {
                child._live = false
            }
        }

        var textContent = data + ""

        if (textContent !== "") {
            var text = new Text(textContent)

            text.parentNode = this
            this.firstChild = text
            this.lastChild = text
        }
    },

    appendChild: function (node) {
        if (!(node instanceof Node)) {
            throw new TypeError("`node` must be a Node")
        }

        // Sanity check, but the real DOM allows it anyways, silently ignoring
        // duplicate attachments.
        if (node.parentNode != null) {
            throw new Error("`node` must not already be attached")
        }

        if (this.firstChild == null) {
            this.firstChild = node
        } else {
            node.previousSibling = this.lastChild
            this.lastChild.nextSibling = node
        }

        this.lastChild = node
        node.parentNode = this

        if (this._live) {
            node._live = true
            var child = node

            while ((child = step(node, child)) != null) {
                child._live = true
            }
        }
    },

    removeChild: function (node) {
        if (!(node instanceof Node)) {
            throw new TypeError("`node` must be a Node")
        }

        // Sanity check, but the real DOM allows it anyways, silently ignoring
        // duplicate attachments.
        if (node.parentNode !== this) {
            throw new Error("`node` must be a child of this node")
        }

        if (this.firstChild === node) {
            this.firstChild = node.nextSibling
        } else if (this.lastChild === node) {
            this.lastChild = node.previousSibling
        }

        var prev = node.previousSibling
        var next = node.nextSibling

        if (next != null) next.previousSibling = prev
        if (prev != null) prev.nextSibling = next

        node.nextSibling = null
        node.previousSibling = null
        node.parentNode = null

        if (this._live) {
            node._live = false
            var child = node

            while ((child = step(node, child)) != null) {
                child._live = false
            }
        }
    },

    getAttribute: function (key) {
        return hasOwn.call(this._attrs, key)
    },

    setAttribute: function (key, value) {
        this._attrs[key] = value
    },

    // Super dumb, only supports classes on a single node, and specifically
    // `style[data-tl-style]`.
    querySelector: function (selector) {
        if (selector === "style[data-tl-style]") {
            return queryStyleThallium(this)
        } else {
            return queryClass(this, selector.replace(/\./g, " ").trim())
        }
    },

    // Returns a dead list, not a live one.
    getElementsByClassName: function (className) {
        var elements = {length: 0}
        var child = this // eslint-disable-line consistent-this

        while ((child = step(this, child)) != null) {
            if (child instanceof Element &&
                    child.className.indexOf(className) >= 0) {
                elements[elements.length++] = child
            }
        }

        return elements
    },

    // Returns a dead list, not a live one.
    getElementsByTagName: function (tagName) {
        tagName = tagName.toUpperCase()
        var elements = {length: 0}
        var child = this // eslint-disable-line consistent-this

        while ((child = step(this, child)) != null) {
            if (child instanceof Element && child.tagName === tagName) {
                elements[elements.length++] = child
            }
        }

        return elements
    },
})

function Document() {
    readonly(this, "head", this.createElement("head"))
    readonly(this, "body", this.createElement("body"))
    this.title = ""
    this.head._live = true
    this.body._live = true
}

methods(Document, {
    createElement: function (tagName) {
        return new Element(tagName + "")
    },

    createTextNode: function (textContent) {
        return new Text(textContent + "")
    },

    getElementById: function (id) {
        var child = this.head

        while ((child = step(this.head, child)) != null) {
            if (child instanceof Element && child.id === id) {
                return child
            }
        }

        child = this.body
        while ((child = step(this.body, child)) != null) {
            if (child instanceof Element && child.id === id) {
                return child
            }
        }

        return null
    },
})

function Window(document) {
    readonly(this, "document", document)
    this._frameCallbacks = []
    this._frameId = 0
}

methods(Window, {
    requestAnimationFrame: function (callback) {
        this._frameCallbacks.push(callback)
    },
})

function initFromVirtual(document, type, attrs, children) {
    var index = type.indexOf(".")
    var name = index < 0 ? type : type.slice(0, index)
    var elem = document.createElement(name)

    if (index >= 0) {
        elem.className = type.slice(index + 1).replace(/\./g, " ")
    }

    if (Array.isArray(attrs)) {
        children = attrs
        attrs = undefined
    }

    if (attrs != null) {
        if (typeof attrs !== "object") {
            throw new TypeError("`attrs` must be an object if it exists")
        }

        for (var key in attrs) {
            if (hasOwn.call(attrs, key)) elem[key] = attrs[key]
        }
    }

    if (children != null) {
        if (!Array.isArray(children)) {
            throw new TypeError("`children` must be an array if it exists")
        }

        for (var i = 0; i < children.length; i++) {
            var node = children[i]

            if (node != null) {
                if (typeof node !== "object") {
                    node = document.createTextNode(node)
                } else if (node.parentNode != null) {
                    throw new TypeError("`child` must not already be attached")
                }

                elem.appendChild(node)
            }
        }
    }

    return elem
}

function createMock(opts) {
    var document = opts.document
    var window = new Window(document)

    function h(type, attrs, children) {
        return initFromVirtual(document, type + "", attrs, children)
    }

    h.text = function (textContent) {
        return document.createTextNode(textContent + "")
    }

    function frameLoop(ref) {
        if (!ref.active) return
        while (window._frameCallbacks.length) {
            window._frameCallbacks.shift()(++window._frameId)
        }
        Promise.resolve(ref).then(frameLoop)
    }

    function resolveFrames(p) {
        var ref = {active: true}

        frameLoop(ref)
        return Util.pfinally(Promise.resolve(p), function () {
            ref.active = false
        })
    }

    return {
        resolveFrames: resolveFrames,
        document: document,
        window: window,
        h: h,

        isLive: function (node) {
            return opts.isLive(node)
        },

        importNode: function (node) {
            return opts.importNode(node)
        },

        click: function (node) {
            var event = new Event()
            var result

            if (node.onclick != null) result = node.onclick(event)
            return {event: event, result: result}
        },
    }
}

function MockInject() {
    this.document = new Document()
}

methods(MockInject, {
    isLive: function (node) {
        return node._live
    },

    importNode: function (node) {
        if (node instanceof Text) {
            return new Text(node.textContent)
        } else {
            var elem = new Element(node.tagName)

            elem.className = node.className
            elem.id = node.id
            for (var attr in node._attrs) {
                if (hasOwn.call(node._attrs, attr)) {
                    elem._attrs[attr] = node._attrs[attr]
                }
            }

            for (var key in node) {
                if (hasOwn.call(node, key) && !hasOwn.call(elem, key)) {
                    elem[key] = node[key]
                }
            }

            return elem
        }
    },
})

function NativeInject() {
    this.document = globalDocument.implementation.createDocument()
}

methods(NativeInject, {
    isLive: function (node) {
        return this.document.head.contains(node) ||
            this.document.body.contains(node)
    },

    importNode: function (node) {
        return node
    },
})

function invokeList(list) {
    for (var i = 0; i < list.length; i++) {
        (0, list[i])()
    }
}

exports.init = function (func) {
    invokeList(hooks.before)
    return Util.pfinally(
        Util.ptry(function () {
            return func(createMock(new MockInject()))
        }),
        function () { invokeList(hooks.after) }
    )
}

function inject(Inject, func) {
    return function () {
        invokeList(hooks.before)
        var mock = createMock(new Inject())

        D.document = mock.document
        D.window = mock.window

        return Util.pfinally(
            Util.ptry(function () { return func(mock.h, mock) }),
            function () {
                D.document = globalDocument
                D.window = globalWindow
                invokeList(hooks.after)
            }
        )
    }
}

exports.D = D

function makeIt(Inject) {
    var it

    if (Inject != null) {
        it = function () {}
        it.only = function () {}
        it.skip = function () {}
    } else {
        it = function (name, body) {
            global.it(name, inject(Inject, body))
        }

        it.only = function (name, body) {
            global.it.only(name, inject(Inject, body))
        }

        it.skip = function (name) {
            global.it.skip(name, function () {})
        }
    }

    return it
}

exports.it = makeIt(MockInject)
exports.it.dom = makeIt(globalWindow != null ? NativeInject : undefined)
