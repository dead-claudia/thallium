"use strict"

// Derived from https://github.com/jonschlinkert/to-absolute-glob, but modified
// to not actually resolve paths, but just normalize them.

const path = require("path")

module.exports = (glob, cwd) => {
    // store first and last characters before glob is modified
    const isNegative = glob[0] === "!"
    const hasTrailing = glob.slice(-1) === "/"

    if (isNegative) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && glob.slice(-1) !== "/") glob += "/"
    return isNegative ? `!${glob}` : glob
}
