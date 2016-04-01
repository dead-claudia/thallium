'use strict'

require! {
    path
    '../messages': {m}
    './argument-error': {ArgumentError}
}

hasOwn = Object::hasOwnProperty

# `true` means it requires a value. If the key doesn't exist, the flag is
# implicitly false, since this table is checked for truthiness, not actual
# existence + true/false.
requiresValue =
    'config': true
    'cwd': true
    'help-detailed': false
    'help': false
    'register': true

aliases =
    h: 'help'
    H: 'help-detailed'
    c: 'config'
    r: 'register'

/**
 * Serializes `argv` into a list of tokens.
 */
serialize = (argv) ->
    args = []
    boolean = true

    push = (type, value) ->
        args.push {type, value, boolean}

    pushFlag = (arg) ->
        boolean := not requiresValue[arg]
        push 'flag', arg

    shorthand = (entry) ->
        unless boolean
            throw new Error 'No value should be required yet'

        # This is a string
        for short in entry.slice 1
            # If we're not yet done parsing the shorthand alias, then the
            # current binary option *clearly* won't have a value to use.
            unless boolean
                throw new ArgumentError m 'missing.cli.shorthand', last

            # Silently ignore invalid flags.
            if hasOwn.call aliases, short
                pushFlag aliases[short]

            last = short

    rest = (i) ->
        unless boolean
            throw new ArgumentError m 'missing.cli.shorthand', argv[i - 2]

        while i < argv.length
            push 'file', argv[i++]

    value = (value) ->
        push 'value', value
        boolean := true

    for entry, i in argv
        if entry == '--'
            rest i + 1
            break
        # Allow anything other than `--` or in the value position. If it's a
        # mistake, this'll likely complain later, anyways.
        else unless boolean and entry.0 == '-'
            value entry
        else unless entry.1 == '-'
            shorthand entry
        else
            pushFlag entry.slice 2

    args

arg = (value = null) ->
    {passed: false, value}

argSet = (arg, value) ->
    arg.passed = true
    arg.value = value

argPush = (arg, value) ->
    arg.passed = true
    arg.value.push value

/**
 * Properties:
 *
 * config: The config file to use. The default is inferred from
 *         `#{args.files.0}/.techtonic.#{ext}`, taking the first `ext` from
 *         `--register` or whatever's inferred from node-interpret.
 *
 * cwd: This changes the default current working directory. It defaults to the
 *      initial `process.cwd!`, although the unit tests do use internal hooks
 *      to change that default.
 *
 * register: A list of extensions + possible modules to register. This
 *           effectively disables much of the inferrence magic based on `cwd`,
 *           the first `files` glob, and `config` to come up with something
 *           sensible.
 *
 * files: A list of file globs to load.
 *
 * help: If set to `'simple'` or `'detailed'`, display the help prompt.
 */
initArgs = (cwd) ->
    config: arg!
    cwd: arg cwd
    register: arg []
    files: arg []
    help: arg!

types =
    flag: (args, arg) !->
        | arg.value == 'help' => args.help `argSet` 'simple'
        | arg.value == 'help-detailed' => args.help `argSet` 'detailed'
        | otherwise => return arg

    value: (args, arg, last) !->
        | last == void =>
            args.files `argPush` arg.value
            # Silently ignore invalid arguments
        | hasOwn.call args, last.value =>
            current = args[last.value]

            if Array.isArray current.value
                current `argPush` arg.value
            else
                current `argSet` (last.boolean or arg.value)

    file: (args, arg) !-> args.files `argPush` arg.value

export parseArgs = (cwd, argv) ->
    args = initArgs cwd
    last = serialize argv .reduce do
        (last, arg) -> types[arg.type] args, arg, last
        void

    if last? and not last.boolean
        throw new ArgumentError m 'missing.cli.argument', last.value

    if args.files.value.length == 0
        args.files.value = [path.join 'test', '**']

    args
