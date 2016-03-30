'use strict'

require! {
    path

    '../../../src/index': {t}
    '../../../src/cli/parse-args': {parseArgs}
}

suite 'cli arguments (basic)', !->
    defaultCwd = 'base'
    testDir = path.join 'test', '**'

    arg = (passed, value = null) -> {passed, value}

    test = (description, str, {
        config = arg false
        cwd = arg false, defaultCwd
        register = arg false, []
        files = arg false, [testDir]
        help = arg false
    } = {}) ->
        str .= trim!
        global.test description, !->
            parsed = parseArgs defaultCwd, if str then str.split /\s+/g else []
            t.deepEqual parsed, {config, cwd, register, files, help}

    test 'works with defaults', '', {}
    test 'works with --help', '--help', help: arg true, 'simple'
    test 'works with -h', '-h', help: arg true, 'simple'
    test 'works with --help-detailed', '--help-detailed', help: arg true, 'detailed'
    test 'works with -H', '-H', help: arg true, 'detailed'
    test 'works with --cwd', '--cwd foo', cwd: arg true, 'foo'
    test 'works with --config', '--config foo', config: arg true, 'foo'
    test 'works with -c', '-c foo', config: arg true, 'foo'

    test 'works with --register (with dot + no module)',
        '--register .ext',
        register: arg true, ['.ext']

    test 'works with --register (no dot + no module)',
        '--register ext',
        register: arg true, ['ext']

    test 'works with --register (with dot + with module)',
        '--register .ext:module',
        register: arg true, ['.ext:module']

    test 'works with --register (no dot + with module)',
        '--register ext:module',
        register: arg true, ['ext:module']

    test 'works with -r (no dot + no module)',
        '-r ext',
        register: arg true, ['ext']

    test 'works with -r (no dot + with module)',
        '-r ext:module',
        register: arg true, ['ext:module']

    my = path.join 'my-test', '**', '*'
    other = path.join 'other-test', '**', '*'

    test 'works with file arguments',
        "#{my} #{other}",
        files: arg true, [my, other]

    test 'works with rest files with invalid options',
        "#{my} -- --weird-file",
        files: arg true, [my, '--weird-file']

    test 'works with rest files with valid options',
        "#{my} -- --help",
        files: arg true, [my, '--help']

    # Note: this is a slightly flaky test.
    test 'ignores invalid options', '--why -AM -i --here', {}
