import t from "../src/index.js"

export function fail(name, ...args) {
    t.throws(() => t[name](...args), t.AssertionError)
}

export function basic(desc, callback) {
    suite(desc, () => test("works", callback))
}
