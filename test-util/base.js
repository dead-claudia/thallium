"use strict"

exports.push = ret => (arg, done) => {
    ret.push(arg)
    done()
}

exports.n = (type, path, value) => ({type, path, value})
exports.p = (name, index) => ({name, index})
