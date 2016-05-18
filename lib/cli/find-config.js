"use strict"

var path = require("path")
var methods = require("../methods.js")
var globParent = require("./glob-parent.js")
var LoaderData = require("./loader-data.js")

var hasOwn = Object.prototype.hasOwnProperty

// The dirname of the root is the root
function isRoot(dir) {
    return path.dirname(dir) === dir
}

function Utils(state, loaders) {
    this.exists = state.util.exists
    // calls to `check` are cached to avoid numerous duplicate directory
    // reads.
    this.cache = Object.create(null)
    this.loaders = loaders
    this.resolve = state.util.resolve
}

methods(Utils, {
    check: function (file) {
        if (hasOwn.call(this.cache, file)) {
            return this.cache[file]
        } else {
            return this.cache[file] = this.exists(file)
        }
    },

    walkUp: function (dir, base) {
        dir = this.resolve(dir)
        for (;;) {
            var file = path.join(dir, base)

            if (this.check(file)) return file
            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    },

    // 1. Get a list of all `.tl.{ext}` files.
    // 2. Find the first file to exist.
    // 3. If we can't find one and we're not at the root level, recurse upwards.
    search: function (dir) {
        dir = this.resolve(dir)
        for (;;) {
            var base = path.join(dir, ".tl")

            for (var key in this.loaders) {
                if (hasOwn.call(this.loaders, key)) {
                    var loader = this.loaders[key]

                    // Skip the extension-free loaders
                    if (!loader.ext) continue

                    var file = base + loader.ext

                    if (this.check(file)) return file
                }
            }

            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    },

    findDirectMatch: function (list) {
        for (var i = 0; i < list.length; i++) {
            var glob = list[i]

            if (LoaderData.isValid(glob)) {
                var ret = this.walkUp(
                    globParent(glob),
                    ".tl" + LoaderData.getExt(glob))

                if (ret != null) return ret
            }
        }

        return null
    },

    findWalkingMatch: function (list) {
        for (var j = 0; j < list.length; j++) {
            var glob = list[j]
            var ret

            if (LoaderData.isValid(glob)) {
                ret = this.walkUp(globParent(glob), ".tl.js")
            } else {
                ret = this.search(globParent(glob))
            }

            if (ret != null) return ret
        }

        return null
    },

    // Try to find one with a matching extension, or failing that, one in JS.
    findExact: function (list) {
        var ret = this.findDirectMatch(list)

        return ret != null ? ret : this.findWalkingMatch(list)
    },
})

module.exports = function (state, loaders) {
    var utils = new Utils(state, loaders)
    var raw

    if (state.args.config != null) {
        raw = state.args.config
    } else if (state.args.files.length !== 0) {
        raw = utils.findExact(state.args.files)
    } else {
        raw = utils.search("test")
    }

    if (raw == null) return null

    var resolved = state.util.resolve(raw)

    // The original iteration only checked arguments, not the file system.
    if (LoaderData.isValid(resolved)) {
        var ext = LoaderData.getExt(resolved)

        // This is meaningless for simple loaders, so it works.
        if (hasOwn.call(loaders, ext)) loaders[ext].use = true
    }

    return resolved
}
