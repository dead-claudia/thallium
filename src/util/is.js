// For better NaN handling
/* eslint-disable no-self-compare */

export function strictIs(a, b) {
    return a === b || a !== a && b !== b
}

export function looseIs(a, b) {
    return a == b || a != a && b != b // eslint-disable-line eqeqeq
}
