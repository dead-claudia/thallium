"use strict"

var path = require("path")

exports.isObjectLike = function (v) {
    return v != null && (typeof v === "object" || typeof v === "function")
}

var hasOwn = Object.prototype.hasOwnProperty

function hasDefault(v) {
    return v != null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        hasOwn.call(v, "default")
}

// Resolve ES6 transpiled modules as well as default-export CommonJS modules
exports.resolveDefault = function (mod) {
    return hasDefault(mod) ? mod.default : mod
}

// Since the glob-parent implementation is that simple, might as well
// internalize it. I've combined the is-glob and is-extglob into this as well.

exports.globParent = function (str) {
    // preserves full path in case of trailing path separator
    str += "a"

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}

exports.normalizeGlob = function (glob, cwd) {
    // store first and last characters before glob is modified
    var isNegative = glob[0] === "!"
    var hasTrailing = glob.slice(-1) === "/"

    if (isNegative) glob = glob.slice(1)

    glob = path.normalize(cwd != null ? path.join(cwd, glob) : glob)

    if (hasTrailing && glob.slice(-1) !== "/") glob += "/"
    return isNegative ? "!" + glob : glob
}
