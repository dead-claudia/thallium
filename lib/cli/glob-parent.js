"use strict"

// Since the glob-parent implementation is that simple, might as well
// internalize it. I've combined the is-glob and is-extglob into this as well.

var path = require("path")

module.exports = function (str) {
    // preserves full path in case of trailing path separator
    str += "a"

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}
