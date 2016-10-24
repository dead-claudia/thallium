"use strict"

exports.addReporter = function addReporter(test, reporter) {
    if (test.root.reporters.indexOf(reporter) < 0) {
        test.root.reporters.push(reporter)
    }
}

exports.removeReporter = function removeReporter(test, reporter) {
    var index = test.root.reporters.indexOf(reporter)

    if (index >= 0) {
        test.root.reporters.splice(index, 1)
    }
}

exports.addHook = function addHook(list, callback) {
    if (list != null) {
        list.push(callback)
        return list
    } else {
        return [callback]
    }
}

exports.removeHook = function removeHook(list, callback) {
    if (list == null) return undefined
    if (list.length === 1) {
        if (list[0] === callback) return undefined
    } else {
        var index = list.indexOf(callback)

        if (index >= 0) list.splice(index, 1)
    }
    return list
}
