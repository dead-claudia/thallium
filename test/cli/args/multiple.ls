'use strict'

require! {
    path

    '../../../src/index': {t}
    '../../../src/cli/parse-args': {parseArgs}
}

suite 'cli arguments (multiple)', !->
    defaultCwd = 'base'
    testDir = path.join 'test', '**'

    arg = (passed, value = null) -> {passed, value}

    test = (description, str, {
        config = arg false
        cwd = arg false, defaultCwd
        register = arg false, []
        files = arg false, [testDir]
        help = arg false
    } = {}) !->
        str .= trim!
        global.test description, !->
            parsed = parseArgs defaultCwd, if str then str.split /\s+/g else []
            t.deepEqual parsed, {config, cwd, register, files, help}

    test 'works with multiple register hooks via --register',
        '--register foo:module1 --register bar:module2',
        register: arg true, <[foo:module1 bar:module2]>

    test 'works with multiple register hooks via -r',
        '-r foo:module1 -r bar:module2',
        register: arg true, <[foo:module1 bar:module2]>
