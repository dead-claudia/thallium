'use strict'

# This is a basic TAP-generating reporter.

tty = require 'tty'
{inspect} = require 'util'

windowWidth = do ->
    if tty.isatty(1) and tty.isatty(2)
        if process.stdout.columns?
            return process.stdout.columns
        if process.stdout.getWindowSize?
            return process.stdout.getWindowSize(1)[0]
        if tty.getWindowSize?
            return tty.getWindowSize()[1]

    return 75

eol = if process.platform is 'win32' then '\r\n' else '\n'

print = (text) ->
    new Promise (resolve, reject) ->
        process.stdout.write text + eol, (err) ->
            if err? then reject(err) else resolve()

joinPath = (report) ->
    report.path.map((i) -> i.name).join ' '

printLines = (value, skipFirst) ->
    lines = value.replace(/^/gm, '    ').split(/\r?\n/g)
    rest = if skipFirst then lines.slice(1) else lines

    rest.reduce ((p, line) -> p.then -> print(line)), Promise.resolve()

printRaw = (key, str) ->
    if str.length > windowWidth - key.length or /\r?\n|[:?-]/.test(str)
        print("  #{key}: |-")
        .then -> printLines(str, no)
    else
        print("  #{key}: #{str}")

printError = ({error: err}) ->
    switch
        when err not instanceof Error
            printRaw 'value', inspect(err)
        when err.name isnt 'AssertionError'
            # Let's *not* depend on the constructor being Thallium's...
            print('  stack: |-')
            .then -> printLines(err.stack, no)
        else
            printRaw 'expected', inspect(err.expected)
            .then -> printRaw 'actual', inspect(err.actual)
            .then -> printRaw 'message', err.message
            .then -> print('  stack: |-')
            .then ->
                message = err.message
                err.message = ''
                printLines(err.stack, yes).then ->
                    err.message = message
                    return

module.exports = ->
    counter = tests = pass = fail = skip = 0

    template = (report, tmpl, skip) ->
        counter++ unless skip
        path = joinPath(report).replace(/\$/g, '$$$$')
        if report.hook
            path += if report.name
                " (#{report.stage})"
            else
                " (#{report.stage} ‒ #{report.name})"

        print(
            tmpl.replace(/%c/g, counter)
                .replace(/%p/g, path))

    (report) ->
        switch
            when report.isStart
                counter = tests = pass = fail = skip = 0
                print('TAP version 13')

            when report.isEnter
                tests++
                pass++
                # Print a leading comment, to make some TAP formatters prettier.
                template(report, '# %p', true)
                .then -> template(report, 'ok %c')

            when report.isPass
                tests++
                pass++
                template(report, 'ok %c %p')

            when report.isFail, report.isHook
                tests++
                fail++
                template(report, 'not ok %c %p')
                .then -> print('  ---')
                .then -> printError(report)
                .then -> print('  ...')

            when report.isSkip
                skip++
                template(report, 'ok %c # skip %p')

            when report.isEnd
                p = print("1..#{counter}")
                .then -> print("# tests #{tests}")
                if pass then p = p.then -> print("# pass #{pass}")
                if fail then p = p.then -> print("# fail #{fail}")
                if skip then p = p.then -> print("# skip #{skip}")
                p

            when report.isError
                return print('Bail out!')
                .then -> print('  ---')
                .then -> printError(report)
                .then -> print('  ...')
