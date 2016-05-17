"use strict"

exports.push = ret => (arg, done) => {
    ret.push(arg)
    done()
}

exports.n = (type, path, value, slow) => ({type, path, value, slow: !!slow})
exports.p = (name, index) => ({name, index})
