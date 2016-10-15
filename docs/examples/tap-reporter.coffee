'use strict'

# This is a basic TAP-generating reporter.

tty = require 'tty'
{inspect} = require 'util'

windowWidth = unless tty.isatty(1) and tty.isatty(2)
    75
else if process.stdout.columns?
    process.stdout.columns
else if process.stdout.getWindowSize?
    process.stdout.getWindowSize(1)[0]
else if tty.getWindowSize?
    tty.getWindowSize()[1]
else
    75

_ = reset: ->
    @counter = @tests = @pass = @fail = @skip = 0
_.reset()

joinPath = (ev) ->
    (i.name for i in ev.path).join ' '

template = (ev, tmpl, skip) ->
    _.counter++ unless skip

    console.log tmpl.replace(/%c/g, _.counter)
                    .replace(/%p/g, joinPath(ev).replace(/\$/g, '$$$$'))

printLines = (value, skipFirst) ->
    lines = value.replace(/^/gm, '    ').split(/\r?\n/g)

    for line in (if skipFirst then lines[1..] else lines)
        console.log line

printRaw = (key, str) ->
    if str.length > windowWidth - key.length or /\r?\n|[:?-]/.test(str)
        console.log "  #{key}: |-"
        printLines str, no
    else
        console.log "  #{key}: #{str}"

printError = ({value: err}) ->
    unless err instanceof Error
        printRaw 'value', inspect(err)
    else if err.name isnt 'AssertionError'
        # Let's *not* depend on the constructor being Thallium's...
        console.log '  stack: |-'
        printLines err.stack, no
    else
        printRaw 'expected', inspect(err.expected)
        printRaw 'actual', inspect(err.actual)
        printRaw 'message', err.message
        console.log '  stack: |-'

        message = err.message
        err.message = ''
        printLines err.stack, yes
        err.message = message

module.exports = (ev) ->
    switch
        when ev.start
            console.log 'TAP version 13'

        when ev.enter
            _.tests++
            _.pass++
            # Print a leading comment, to make some TAP formatters prettier.
            template ev, '# %p', yes
            template ev, 'ok %c'

        # This is meaningless for the output.
        when ev.leave then

        when ev.pass
            _.tests++
            _.pass++
            template ev, 'ok %c %p'

        when ev.fail
            _.tests++
            _.fail++
            template ev, 'not ok %c %p'
            console.log '  ---'
            printError ev
            console.log '  ...'

        when ev.skip
            _.skip++
            template ev, 'ok %c # skip %p'

        when ev.end
            console.log "1..#{_.counter}"
            console.log "# tests #{_.tests}"
            console.log "# pass #{_.pass}" if _.pass
            console.log "# fail #{_.fail}" if _.fail
            console.log "# skip #{_.skip}" if _.skip
            _.reset()

        when ev.error
            console.log 'Bail out!'
            console.log '  ---'
            printError ev
            console.log '  ...'
            _.reset()

    return
