"use strict"

exports.wrap = function (done, func) {
    return function (err) {
        if (err != null) return done(err)
        try {
            func()
        } catch (e) {
            return done(e)
        }
        return done()
    }
}

exports.push = function (ret) {
    return function (arg, done) {
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, name, index, parent, value) {
    return {
        type: type,
        name: name,
        index: index,
        parent: parent,
        value: value,
    }
}

exports.p = function (name, index, parent) {
    return {name: name, index: index, parent: parent}
}
