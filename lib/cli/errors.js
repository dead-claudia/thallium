"use strict"

exports.Bail = function (index) {
    this.index = index
}

exports.Exit = function (e) {
    this.error = e
}
