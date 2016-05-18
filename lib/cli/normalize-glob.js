"use strict"

// Derived from https://github.com/jonschlinkert/to-absolute-glob, but modified
// to not actually resolve paths, but just normalize them.

var path = require("path")

module.exports = function (glob, cwd) {
    // store first and last characters before glob is modified
    var isNegative = glob[0] === "!"
    var hasTrailing = glob.slice(-1) === "/"

    if (isNegative) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && glob.slice(-1) !== "/") glob += "/"
    return isNegative ? "!" + glob : glob
}
