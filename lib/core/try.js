"use strict"

function apply(f, inst, args) {
    switch (args.length) {
    case 0: return f.call(inst)
    case 1: return f.call(inst, args[0])
    case 2: return f.call(inst, args[0], args[1])
    case 3: return f.call(inst, args[0], args[1], args[2])
    case 4: return f.call(inst, args[0], args[1], args[2], args[3])
    default: return f.apply(inst, args)
    }
}

exports.pass = pass
function pass(value) {
    return {caught: false, value: value}
}

exports.fail = fail
function fail(e) {
    return {caught: true, value: e}
}

exports.try0 = function (f, inst) {
    try {
        return pass(f.call(inst))
    } catch (e) {
        return fail(e)
    }
}

exports.try1 = function (f, inst, arg) {
    try {
        return pass(f.call(inst, arg))
    } catch (e) {
        return fail(e)
    }
}

exports.try2 = function (f, inst, arg0, arg1) {
    try {
        return pass(f.call(inst, arg0, arg1))
    } catch (e) {
        return fail(e)
    }
}

exports.tryN = function (f, inst, args) {
    try {
        return pass(apply(f, inst, args))
    } catch (e) {
        return fail(e)
    }
}
