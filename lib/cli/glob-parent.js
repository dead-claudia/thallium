"use strict"

/**
 * Since this is used in the initialization phase as well, I've separated it out
 * into an independent module to avoid some unnecessary module resolution.
 */
var path = require("path")

// Since the glob-parent implementation is that simple, might as well
// internalize it. I've combined the is-glob and is-extglob into this as well.
module.exports = function (str) {
    // preserves full path in case of trailing path separator
    str = path.normalize(path.join(str, "a"))

    do {
        str = path.dirname(str)
    } while (/([*!?{}(|)[\]]|[@?!+*]\()/.test(str))

    return str
}
