"use strict"

var Util = require("../util.js")

var stackIncludesMessage = (function () {
    var stack = Util.getStack(new Error("test"))

    //     Firefox, Safari                 Chrome, IE
    return !/^(@)?\S+\:\d+/.test(stack) && !/^\s*at/.test(stack)
})()

exports.stripMessage = stripMessage
function stripMessage(e) {
    if (stackIncludesMessage) {
        var stack = Util.getStack(e)
        var index = stack.indexOf(e.message)

        if (index < 0) return Util.getStack(e).replace(/^\s+/gm, "")
        index = stack.indexOf("\n", index + e.message.length)
        if (index < 0) return ""
        else return stack.slice(index + 1).replace(/^\s+/gm, "")
    }

    return Util.getStack(e).replace(/^\s+/gm, "")
}

exports.getStack = function (e) {
    var description = (e.name + ": " + e.message).replace(/^\s+/gm, "")
    var stripped = stripMessage(e)

    if (stripped !== "") description += "\n" + stripped
    return description
}
