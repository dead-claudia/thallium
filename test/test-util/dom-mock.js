/* eslint-disable max-statements */

/**
 * The DOM mock is very non-trivial, so it has to be tested.
 */
describe("test-util/dom-mock", function () {
    "use strict"

    function spy() {
        function spy(arg) { spy.calls.push(arg) }
        spy.calls = []
        return spy
    }

    function it(desc, func) {
        Util.it(desc, function () {
            return Util.DOM.init(func)
        })
    }

    function itN(n, desc, func) {
        Util.it(desc, function () {
            return Util.DOM.initN(n, func)
        })
    }

    var globalWindow = Util.DOM.D.window
    var globalDocument = Util.DOM.D.document

    Util.DOM.it("injects a mock", function (h, mock) {
        assert.equal(Util.DOM.D.window, mock.window)
        assert.equal(Util.DOM.D.document, mock.document)
        assert.notEqual(mock.window, globalWindow)
        assert.notEqual(mock.document, globalDocument)
        assert.equal(mock.h, h)
    })

    it("enables element creation", function (mock) {
        var elem = mock.document.createElement("div")

        assert.equal(elem.tagName, "DIV")
        assert.equal(elem.id, "")
        assert.equal(elem.className, "")
        assert.equal(elem.firstChild, null)
        assert.equal(elem.lastChild, null)
        assert.equal(elem.previousSibling, null)
        assert.equal(elem.nextSibling, null)
        assert.notOk(mock.isLive(elem))
    })

    it("allows tree building", function (mock) {
        var document = mock.document
        var parent = document.createElement("div")
        var p = document.createElement("p")
        var a = document.createElement("a")
        var ul = document.createElement("ul")
        var li1 = document.createElement("li")
        var li2 = document.createElement("li")
        var li3 = document.createElement("li")

        parent.appendChild(p)
        parent.appendChild(a)
        parent.appendChild(ul)
        ul.appendChild(li1)
        ul.appendChild(li2)
        ul.appendChild(li3)
        li1.className = "one"
        li2.className = "two"
        li3.className = "three"

        assert.equal(parent.parentNode, null)
        assert.equal(parent.firstChild, p)
        assert.equal(parent.lastChild, ul)
        assert.equal(p.parentNode, parent)
        assert.equal(p.previousSibling, null)
        assert.equal(p.nextSibling, a)
        assert.equal(a.parentNode, parent)
        assert.equal(a.previousSibling, p)
        assert.equal(a.nextSibling, ul)
        assert.equal(ul.parentNode, parent)
        assert.equal(ul.previousSibling, a)
        assert.equal(ul.nextSibling, null)
        assert.equal(ul.firstChild, li1)
        assert.equal(ul.lastChild, li3)
        assert.equal(li1.parentNode, ul)
        assert.equal(li1.previousSibling, null)
        assert.equal(li1.nextSibling, li2)
        assert.equal(li2.parentNode, ul)
        assert.equal(li2.previousSibling, li1)
        assert.equal(li2.nextSibling, li3)
        assert.equal(li3.parentNode, ul)
        assert.equal(li3.previousSibling, li2)
        assert.equal(li3.nextSibling, null)
    })

    it("allows removing the first child", function (mock) {
        var document = mock.document
        var parent = document.createElement("div")
        var p = document.createElement("p")
        var a = document.createElement("a")
        var ul = document.createElement("ul")
        var li1 = document.createElement("li")
        var li2 = document.createElement("li")
        var li3 = document.createElement("li")

        parent.appendChild(p)
        parent.appendChild(a)
        parent.appendChild(ul)
        ul.appendChild(li1)
        ul.appendChild(li2)
        ul.appendChild(li3)
        li1.className = "one"
        li2.className = "two"
        li3.className = "three"

        parent.removeChild(p)

        assert.equal(parent.parentNode, null)
        assert.equal(parent.firstChild, a)
        assert.equal(parent.lastChild, ul)

        assert.equal(p.parentNode, null)
        assert.equal(p.previousSibling, null)
        assert.equal(p.nextSibling, null)

        assert.equal(a.parentNode, parent)
        assert.equal(a.previousSibling, null)
        assert.equal(a.nextSibling, ul)
    })

    it("allows creating text nodes", function (mock) {
        var document = mock.document
        var node = document.createTextNode("node")

        assert.equal(node.textContent, "node")
        assert.notHasKey(node, "tagName")
    })

    it("allows appending text nodes", function (mock) {
        var document = mock.document
        var parent = document.createElement("div")
        var node = document.createTextNode("node")

        parent.appendChild(node)

        assert.equal(parent.firstChild, node)
        assert.equal(parent.lastChild, node)
        assert.equal(node.parentNode, parent)
    })

    it("allows getting the text content of a node", function (mock) {
        var document = mock.document
        var parent = document.createElement("div")

        parent.appendChild(document.createTextNode("node"))

        assert.equal(parent.textContent, "node")
    })

    it("allows setting the text content of a node", function (mock) {
        var document = mock.document
        var parent = document.createElement("div")

        parent.textContent = "node"

        assert.notHasKey(parent.firstChild, "tagName")
        assert.equal(parent.firstChild.textContent, "node")
        assert.notHasKey(parent.lastChild, "tagName")
        assert.equal(parent.lastChild.textContent, "node")
        assert.equal(parent.firstChild, parent.lastChild)
        assert.equal(parent.firstChild.parentNode, parent)
    })

    it("has a text node shorthand", function (mock) {
        assert.match(mock.h.text("foo"), mock.document.createTextNode("foo"))
    })

    it("allows a hyperscript-ish API", function (mock) {
        var h = mock.h
        var p, a, ul, li1, li2, li3, text
        var parent = h("div", [
            p = h("p", ["text one"]),
            a = h("a", [text = h.text("text two")]),
            ul = h("ul", [
                li1 = h("li", {className: "one"}),
                li2 = h("li.two"),
                li3 = h("li.three", {}),
            ]),
        ])

        assert.equal(parent.parentNode, null)
        assert.equal(parent.firstChild, p)
        assert.equal(parent.lastChild, ul)
        assert.equal(p.parentNode, parent)
        assert.equal(p.previousSibling, null)
        assert.equal(p.firstChild, p.lastChild)
        assert.notHasKey(p.firstChild, "tagName")
        assert.equal(p.firstChild.textContent, "text one")
        assert.equal(p.nextSibling, a)
        assert.equal(a.parentNode, parent)
        assert.equal(a.previousSibling, p)
        assert.equal(a.firstChild, text)
        assert.equal(a.lastChild, text)
        assert.equal(a.nextSibling, ul)
        assert.equal(ul.parentNode, parent)
        assert.equal(ul.previousSibling, a)
        assert.equal(ul.nextSibling, null)
        assert.equal(ul.firstChild, li1)
        assert.equal(ul.lastChild, li3)
        assert.equal(li1.parentNode, ul)
        assert.equal(li1.previousSibling, null)
        assert.equal(li1.nextSibling, li2)
        assert.equal(li2.parentNode, ul)
        assert.equal(li2.previousSibling, li1)
        assert.equal(li2.nextSibling, li3)
        assert.equal(li3.parentNode, ul)
        assert.equal(li3.previousSibling, li2)
        assert.equal(li3.nextSibling, null)
    })

    it("makes everything live when attached to the body", function (mock) {
        var h = mock.h
        var p, a, ul, li1, li2, li3, text1, text2
        var parent = h("div", [
            p = h("p", [text1 = h.text("text one")]),
            a = h("a", [text2 = h.text("text two")]),
            ul = h("ul", [
                li1 = h("li.one"),
                li2 = h("li.two"),
                li3 = h("li.three"),
            ]),
        ])

        mock.document.body.appendChild(parent)

        assert.equal(parent.parentNode, mock.document.body)
        assert.equal(mock.isLive(parent), true)
        assert.equal(mock.isLive(p), true)
        assert.equal(mock.isLive(text1), true)
        assert.equal(mock.isLive(a), true)
        assert.equal(mock.isLive(text2), true)
        assert.equal(mock.isLive(ul), true)
        assert.equal(mock.isLive(li1), true)
        assert.equal(mock.isLive(li2), true)
        assert.equal(mock.isLive(li3), true)
    })

    it("makes nodes not live when removed from the body", function (mock) {
        var h = mock.h
        var p, a, ul, li1, li2, li3, text1, text2
        var parent = h("div", [
            p = h("p", [text1 = h.text("text one")]),
            a = h("a", [text2 = h.text("text two")]),
            ul = h("ul", [
                li1 = h("li.one"),
                li2 = h("li.two"),
                li3 = h("li.three"),
            ]),
        ])

        mock.document.body.appendChild(parent)
        mock.document.body.removeChild(parent)

        assert.equal(parent.parentNode, null)
        assert.equal(mock.isLive(parent), false)
        assert.equal(mock.isLive(p), false)
        assert.equal(mock.isLive(text1), false)
        assert.equal(mock.isLive(a), false)
        assert.equal(mock.isLive(text2), false)
        assert.equal(mock.isLive(ul), false)
        assert.equal(mock.isLive(li1), false)
        assert.equal(mock.isLive(li2), false)
        assert.equal(mock.isLive(li3), false)
    })

    it("walks the tree for textContent", function (mock) {
        var h = mock.h
        var parent = h("div", [
            h("p", ["text one"]), " ",
            h("p", ["text two"]), " ",
            h("p", [
                "text three ",
                h("em", ["text four"]),
            ]),
            " ", "text five",
        ])

        assert.equal(
            parent.textContent,
            "text one text two text three text four text five"
        )
    })

    it("searches the tree for ids", function (mock) {
        var h = mock.h
        var elem = h("div", {id: "foo"})

        mock.document.body.appendChild(h("div", [
            h("p", ["text one"]),
            h("a", ["text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem]),
                h("li.three"),
            ]),
        ]))

        assert.equal(mock.document.getElementById("foo"), elem)
    })

    it("requests and resolves animation frames", function (mock) {
        var spy1 = spy()
        var spy2 = spy()
        var spy3 = spy()
        var spy4 = spy()
        var spy5 = spy()
        var spy6 = spy()

        mock.window.requestAnimationFrame(spy1)
        mock.window.requestAnimationFrame(spy2)
        mock.window.requestAnimationFrame(spy3)
        mock.window.requestAnimationFrame(function (id) {
            spy4(id)
            mock.window.requestAnimationFrame(spy5)
            mock.window.requestAnimationFrame(spy6)
        })

        mock.resolveFrames().then(function () {
            assert.match(spy1.calls, [1])
            assert.match(spy2.calls, [2])
            assert.match(spy3.calls, [3])
            assert.match(spy4.calls, [4])
            assert.match(spy5.calls, [5])
            assert.match(spy6.calls, [6])
        })
    })

    it("gets a list of elements by class name", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.hasKeys(parent.getElementsByClassName("foo bar"), {
            length: 3,
            0: elem1,
            1: elem2,
            2: elem3,
        })
    })

    it("gets an empty list from non-existent class", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.hasKeys(parent.getElementsByClassName("nope"), {length: 0})
    })

    it("gets a list of elements by tag name", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.hasKeys(parent.getElementsByTagName("div"), {
            length: 3,
            0: elem1,
            1: elem2,
            2: elem3,
        })
    })

    it("gets an empty list from non-existent tag", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.hasKeys(parent.getElementsByTagName("span"), {length: 0})
    })

    it("gets the first element by querying class selector", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.equal(parent.querySelector(".foo.bar"), elem1)
    })

    it("gets `null` from querying a non-existent selector", function (mock) {
        var h = mock.h
        var elem1 = h("div.foo.bar.one")
        var elem2 = h("div.foo.bar.two")
        var elem3 = h("div.foo.bar.three")
        var parent = h("div", [
            h("p", ["text one", elem1]),
            h("a", [elem2, "text two"]),
            h("ul", [
                h("li.one"),
                h("li.two", [elem3]),
                h("li.three"),
            ]),
        ])

        assert.equal(parent.querySelector(".nope"), null)
    })

    it("has a functioning `head`", function (mock) {
        var title = mock.h("title", ["hello"])

        mock.document.head.appendChild(title)
        assert.equal(mock.document.head.firstChild, title)
        assert.equal(mock.document.head.lastChild, title)
    })

    itN(2, "matches two identically constructed documents", function (mocks) {
        mocks[0].document.head.appendChild(mocks[0].h("title", ["hello"]))
        mocks[0].document.body.appendChild(mocks[0].h("div", [
            "bye, ", mocks[0].h("em", ["and go away!"]),
        ]))

        mocks[1].document.head.appendChild(mocks[1].h("title", ["hello"]))
        mocks[1].document.body.appendChild(mocks[1].h("div", [
            "bye, ", mocks[1].h("em", ["and go away!"]),
        ]))

        assert.match(mocks[0].document, mocks[1].document)
    })

    it("handles events correctly", function (mock) {
        var onclick = spy()
        var elem = mock.h("div", {onclick: onclick})

        mock.click(elem)
        assert.equal(onclick.calls.length, 1)
        var event = onclick.calls[0]

        assert.hasKeys(event, {
            defaultPrevented: false,
            propagationStopped: false,
        })

        event.preventDefault()
        assert.equal(event.defaultPrevented, true)

        event.stopPropagation()
        assert.equal(event.propagationStopped, true)
    })

    it("sets events correctly", function (mock) {
        function handler() {}

        assert.equal(mock.h("button", {onclick: handler}).onclick, handler)
        assert.equal(mock.h("button", {onclick: true}).onclick, true)
        assert.equal(mock.h("button", {onclick: false}).onclick, undefined)
    })

    it("doesn't assign event handlers to the node", function (mock) {
        assert.match(
            mock.h("button", {onclick: function () {}}),
            mock.h("button", {onclick: function () {}})
        )
    })

    it("lets handlers be matched without matching functions", function (mock) {
        assert.match(
            mock.h("button", {onclick: function () {}}),
            mock.h("button", {onclick: true})
        )
    })

    // FIXME: test `inspect` - it's causing silent failures in the DOM runner's
    // tests.
})
