'use strict'

require! {
    path
    # This is merely to survive mocking this module
    resolve
}

export a = -> [.. for &]
export sync = resolve.sync
export resolveAsync = resolve

export fixture = (name) ->
    path.resolve __dirname, '../test-fixtures', name

export paths =
    'techtonic': path.resolve __dirname, '../src/index'
    'techtonic/core': path.resolve __dirname, '../src/core'
    'techtonic/assertions': path.resolve __dirname, '../src/assertions'

export push = (ret) -> (arg, done) ->
    ret.push arg
    done!

export n = (type, path, value) -> {type, path, value}
export p = (name, index) -> {name, index}
