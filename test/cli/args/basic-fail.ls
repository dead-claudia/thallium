'use strict'

require! {
    '../../../src/index': {t}
    '../../../src/cli/parse-args': {parseArgs}
    '../../../src/cli/argument-error': {ArgumentError}
}

suite 'cli arguments (basic fail)', !->
    throws = (str) !->
        args = if /^\s+$/.test str then [] else str.split /\s+/g

        test "fails with missing argument for #{str}", !->
            t.throws (!-> parseArgs 'base', args), ArgumentError

    throws '-c'
    throws '--config'
    throws '--cwd'
    throws '-r'
    throws '--register'

    throws '-c --'
    throws '--config --'
    throws '--cwd --'
    throws '-r --'
    throws '--register --'
