/* eslint-env node */
import * as path from "path"

// This is merely to survive mocking this module
import resolveAsync, {sync as resolve} from "resolve"
export {resolve, resolveAsync}

export function fixture(directory) {
    return path.resolve(__dirname, "../test-fixtures", directory)
}

export const paths = {
    "techtonic": path.resolve(__dirname, "../src/index.js"),
    "techtonic/core": path.resolve(__dirname, "../src/core.js"),
    "techtonic/assertions": path.resolve(__dirname, "../src/assertions.js"),
}

export function push(ret) {
    return (arg, done) => {
        ret.push(arg)
        return done()
    }
}

export function n(type, path, value) {
    return {type, path, value}
}

export function p(name, index) {
    return {name, index}
}
