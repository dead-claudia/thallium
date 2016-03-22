'use strict'

require! {
    '../../../src/index': {t}
    '../../../src/cli/merge-config': {validate}
}

suite 'cli merging (validation)', !->
    valid = (name, config) ->
        test "#{name} is valid", !-> validate config

    invalid = (name, config) ->
        test "#{name} is invalid", !->
            t.throws (!-> validate config), TypeError

    valid 'empty object', {}

    suite 'module', !->
        valid 'string', module: 'foo'
        invalid 'number', module: 1
        invalid 'true', module: true
        invalid 'false', module: false
        invalid 'null', module: null
        invalid 'object', module: {}
        invalid 'array', module: []

    suite 'techtonic', !->
        # Just treat any object as a duck. If it blows up in their face, it
        # should hopefully be obvious why.
        valid 'object', techtonic: {}
        invalid 'string', techtonic: 'foo'
        invalid 'number', techtonic: 1
        invalid 'true', techtonic: true
        invalid 'false', techtonic: false
        invalid 'null', techtonic: null
        invalid 'array', techtonic: []

    suite 'files', !->
        valid '[\'test/**\']', files: ['test/**']
        valid '[\'what???!:\\n\']', files: ['what???!:\n']
        valid '[]', files: []
        valid 'string', files: 'test/**'
        invalid 'number', files: 1
        invalid 'true', files: true
        invalid 'false', files: false
        invalid 'null', files: null
        invalid 'object', files: {}
        invalid '[number]', files: [1]
        invalid '[true]', files: [true]
        invalid '[false]', files: [false]
        invalid '[null]', files: [null]
        invalid '[object]', files: [{}]
