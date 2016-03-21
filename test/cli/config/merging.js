import t from "../../../src/index.js"
import {merge} from "../../../src/cli/merge-config.js"

suite("cli config (merging)", () => {
    function load({module = "techtonic", techtonic = {}} = {}) {
        return name => {
            t.equal(name, module)
            return techtonic
        }
    }

    test("merges an empty object", () => {
        // Mark this for more useful assertion messages
        const techtonic = {techtonic: true}
        const files = ["test/**"]
        const config = merge(files, {}, load({techtonic}))

        t.deepEqual(config, {techtonic, files})
        t.equal(config.techtonic, techtonic)
    })

    test("merges `module`", () => {
        // Mark this for more useful assertion messages
        const techtonic = {techtonic: true}
        const files = ["test/**"]
        const module = "./some-techtonic-wrapper.js"
        const config = merge(files, {module}, load({module, techtonic}))

        t.deepEqual(config, {techtonic, files})
        t.equal(config.techtonic, techtonic)
    })

    test("merges `techtonic`", () => {
        // Mark this for more useful assertion messages
        const techtonic = {techtonic: true}
        const files = ["test/**"]
        const config = merge(files, {techtonic}, load())

        t.deepEqual(config, {techtonic, files})
        t.equal(config.techtonic, techtonic)
    })

    test("merges `files`", () => {
        // Mark this for more useful assertion messages
        const techtonic = {techtonic: true}
        const files = ["test/**"]
        const extra = ["other/**"]
        const config = merge(files, {files: extra}, load({techtonic}))

        t.deepEqual(config, {techtonic, files: files.concat(extra)})
        t.equal(config.techtonic, techtonic)
    })

    test("merges everything", () => {
        // Mark this for more useful assertion messages
        const techtonic = {techtonic: true}
        const module = "./some-techtonic-wrapper.js"
        const files = ["test/**"]
        const extra = ["other/**"]
        const config = merge(files, {
            module, techtonic,
            files: extra,
        }, load({module}))

        t.deepEqual(config, {techtonic, files: files.concat(extra)})
        t.equal(config.techtonic, techtonic)
    })
})
