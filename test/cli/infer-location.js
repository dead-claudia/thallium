"use strict"

// const path = require("path")
// const interpret = require("interpret")

const t = require("../../index.js")
const inferLocation = require("../../lib/cli/infer-location.js")
// const LoaderData = require("../../lib/cli/loader-data.js")
const Util = require("../../test-util/cli.js")

const InferredData = inferLocation.InferredData

describe("cli config location inferrence", () => {
    // TODO: fill this in.
    // Note the function prototype:
    //
    // inferLocation(
    //     state: State,
    //     loaders: Map<string | number, Loader>
    // ): Promise<InferredData>

    class Loader extends Util.Loader {}

    function toMap(loader, list) {
        if (!Array.isArray(list)) list = [list]

        return new Map(list.map(l => {
            if (Array.isArray(l)) return l
            if (typeof l === "string") return [l, loader.register(l)]
            return [l.ext, loader.require(l.ext, l.mod, true)]
        }))
    }

    it.skip("gets the default", () => {
        const mock = Util.mock({
            test: {".techtonic.js": "contents"},
        })

        const loader = new Loader("", mock)
        const loaders = toMap(loader, [])

        return inferLocation(loader.state, loaders).then(data => {
            t.deepEqual(data, new InferredData(
                mock.resolve("test/.techtonic.js"),
                loaders
            ))
        })
    })
})
