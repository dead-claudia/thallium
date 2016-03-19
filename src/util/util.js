export function r(type, value) {
    return {type, value}
}

function canHaveProp(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

export function isThenable(value) {
    return canHaveProp(value) && typeof value.then === "function"
}

export function isIterator(value) {
    // Note that `return` isn't checked because V8 only partially
    // supports it natively.
    return canHaveProp(value) && typeof value.next === "function"
}

// Make function binding as lightweight as possible.
export function bind(f, inst) {
    return function () {
        return f.apply(inst, arguments) // eslint-disable-line
    }
}
