"use strict"

describe("assert (match)", function () {
    it("exists", function () {
        assert.isFunction(assert.match)
        assert.isFunction(assert.notMatch)
        assert.isFunction(assert.deepEqual)
        assert.isFunction(assert.notDeepEqual)
    })

    it("checks match + same prototype", function () {
        function A(id) { this.id = id }

        assert.deepEqual(new A(1), new A(1))
        assert.match(new A(1), new A(1))
    })

    it("checks match + different prototype", function () {
        function A(id) { this.id = id }

        assert.notDeepEqual(new A(1), {id: 1})
        assert.match(new A(1), {id: 1})
    })

    it("checks no match + same prototype", function () {
        function A(id) { this.id = id }

        assert.notDeepEqual(new A(1), new A(2))
        assert.notMatch(new A(1), new A(2))
    })

    it("checks no match + different prototype", function () {
        function A(id) { this.id = id }

        assert.notDeepEqual(new A(1), {id: 2})
        assert.notMatch(new A(1), {id: 2})
    })
})
