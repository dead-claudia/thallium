import t from "../../../src/index.js"
import {validateConfig} from "../../../src/cli/merge-json-config.js"

suite("cli json (validation)", () => { // eslint-disable-line max-statements
    function valid(name, config) {
        test(`${name} is valid`, () => validateConfig(config))
    }

    function invalid(name, config) {
        test(`${name} is invalid`, () => {
            t.throws(() => validateConfig(config), TypeError)
        })
    }

    /* eslint-disable max-len */

    valid("empty json", {})

    valid("config: string", {config: "foo.js"})
    invalid("config: number", {config: 1})
    invalid("config: boolean", {config: true})
    invalid("config: object", {config: {}})
    invalid("config: array", {config: []})

    valid("module: string", {module: "foo.js"})
    invalid("module: number", {module: 1})
    invalid("module: true", {module: true})
    invalid("module: false", {module: false})
    invalid("module: null", {module: null})
    invalid("module: object", {module: {}})
    invalid("module: array", {module: []})

    valid('register: ["ext"]', {register: ["ext"]})
    valid('register: ["ext1", "ext2"]', {register: ["ext1", "ext2"]})
    valid('register: ["ext1", "ext2:mod"]', {register: ["ext1", "ext2:mod"]})
    valid('register: ["ext:module"]', {register: ["ext:module"]})
    valid('register: ["-x:what?"]', {register: ["-x:what?"]})
    valid('register: ["n-x:what?"]', {register: ["n-x:what?"]})
    valid('register: ["1:man"]', {register: ["1:man"]})
    valid("register: []", {register: []})
    invalid("register: number", {register: 1})
    invalid("register: true", {register: true})
    invalid("register: false", {register: false})
    invalid("register: null", {register: null})
    invalid("register: object", {register: {}})
    invalid('register: ["ext:"]', {register: ["ext:"]})
    invalid('register: [":module"]', {register: [":module"]})
    invalid('register: [".ext:module"]', {register: [".ext:module"]})
    invalid('register: ["ext:./wtf!!?!\\n!"]', {register: ["ext:./wtf!!?!\n!"]})
    invalid('register: ["ext:\\n"]', {register: ["ext:\n"]})
    invalid("register: [number]", {register: [1]})
    invalid("register: [true]", {register: [true]})
    invalid("register: [false]", {register: [false]})
    invalid("register: [null]", {register: [null]})
    invalid("register: [object]", {register: [{}]})

    valid("reporters: []", {reporters: []})
    valid('reporters: ["reporter"]', {reporters: ["reporter"]})
    valid('reporters: [["reporter"]]', {reporters: [["reporter"]]})
    valid('reporters: ["mod1", "mod2"]', {reporters: ["mod1", "mod2"]})
    valid('reporters: [["mod1"], "mod2"]', {reporters: [["mod1"], "mod2"]})
    valid('reporters: ["mod1", ["mod2"]]', {reporters: ["mod1", ["mod2"]]})
    valid('reporters: [["mod1"], ["mod2"]]', {reporters: [["mod1"], ["mod2"]]})
    valid('reporters: [["reporter", {"opt": 1}]]', {reporters: [["reporter", {opt: 1}]]})
    valid('reporters: [["reporter", "opt"]]', {reporters: [["reporter", "opt"]]})
    valid('reporters: [["reporter", 1]]', {reporters: [["reporter", 1]]})
    valid('reporters: [["reporter", true]]', {reporters: [["reporter", true]]})
    valid('reporters: [["reporter", false]]', {reporters: [["reporter", false]]})
    valid('reporters: [["reporter", null]]', {reporters: [["reporter", null]]})
    invalid("reporters: string", {reporters: "reporter"})
    invalid("reporters: number", {reporters: 1})
    invalid("reporters: true", {reporters: true})
    invalid("reporters: false", {reporters: false})
    invalid("reporters: null", {reporters: null})
    invalid("reporters: object", {reporters: {}})
    invalid('reporters: ["reporter", null]', {reporters: ["reporter", null]})
    invalid('reporters: ["reporter", 1]', {reporters: ["reporter", 1]})
    invalid("reporters: [number]", {reporters: [1]})
    invalid("reporters: [true]", {reporters: [true]})
    invalid("reporters: [false]", {reporters: [false]})
    invalid("reporters: [null]", {reporters: [null]})
    invalid("reporters: [object]", {reporters: [{}]})

    valid('files: ["test/**"]', {files: ["test/**"]})
    valid('files: ["what???!:\\n"]', {files: ["what???!:\n"]})
    valid("files: []", {files: []})
    valid("files: string", {files: "test/**"})
    invalid("files: number", {files: 1})
    invalid("files: true", {files: true})
    invalid("files: false", {files: false})
    invalid("files: null", {files: null})
    invalid("files: object", {files: {}})
    invalid("files: [number]", {files: [1]})
    invalid("files: [true]", {files: [true]})
    invalid("files: [false]", {files: [false]})
    invalid("files: [null]", {files: [null]})
    invalid("files: [object]", {files: [{}]})

    /* eslint-enable max-len */
})
