import t from "../src/index.js"

suite("class AssertionError", () => {
    test("exists", () => {
        t.function(t.AssertionError)
    })

    test("is an error", () => {
        t.instanceof(new t.AssertionError("message"), Error)
    })
})
