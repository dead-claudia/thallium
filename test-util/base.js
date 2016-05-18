"use strict"

exports.push = function (ret) {
    return function (arg, done) {
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, path, value, slow) {
    return {type: type, path: path, value: value, slow: !!slow}
}

exports.p = function (name, index) {
    return {name: name, index: index}
}
