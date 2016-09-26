'use strict'

# CoffeeScript make for a much easier ShellJS experience.

require 'shelljs/make'
chokidar = require 'chokidar'
semver = require 'semver'
pkg = require './package.json'

config.fatal = true

target.all = ->
    target.lint()
    target.test()

target.lint = ->
    exec 'eslint . --cache --color'
    exec 'coffeelint . --cache --color=always'

target.test = ->
    target['test:karma']()
    target['test:mocha']()

target['test:karma'] = ->
    exec 'karma start --colors --single-run --browsers Chrome'

target['test:mocha'] = ->
    exec 'mocha --colors'

watch = (onchange) ->
    # Give time for the file changes to settle by delaying and debouncing the
    # `onchange` handler.
    timeout = Date.now() + 500 # ms
    current = undefined

    invoke = (event, path) ->
        console.error "#{event}: #{path}"
        onchange()

    chokidar.watch [
        '{bin,fixtures,helpers,lib,r,scripts,test}/**/{.,}*.js',
        '{bin,fixtures,helpers,lib,r,scripts,test}/**/{.,}*.coffee',
    ], ignored: ['**/test-bundle.js']
    .on 'all', (event, path) ->
        clearTimeout current if current?
        current = setTimeout (-> invoke event, path), timeout

target.watch = -> watch target.test
target['watch:karma'] = -> watch target['test:karma']
target['watch:mocha'] = -> watch target['test:mocha']

target.bundle = ->
    exec 'browserify -dr ./lib/browser-bundle.js:thallium -o thallium.js'

target.release = (args) ->
    force = false
    increment = undefined

    setIncrement = (arg) ->
        if increment?
            console.error "Unexpected additional increment parameter: #{arg}"
            exit 1
        increment = arg

    for arg in args
        switch arg
            when 'major', 'minor', 'patch' then setIncrement arg
            when 'premajor', 'preminor', 'prepatch' then setIncrement arg
            when 'prerelease' then setIncrement arg
            when '--force', '-f' then force = yes
            when '--no-force' then force = false

    unless increment?
        console.error '''
            Increment parameter required. Use this target like so:

            node make release -- <semver-compatible increment> [ -f ]
        '''
        exit 1

    unless force
        changelogUpdated = no
        treeDirty = no

        exec '/usr/bin/env bash scripts/test.sh'
        {stdout} = exec 'git status --porcelain', silent: yes
        for line in stdout.split /\r?\n/g
            if line isnt ''
                if /^( M|M |MM) CHANGELOG\.md$/.test line
                    changelogUpdated = yes
                else
                    treeDirty = yes

        unless changelogUpdated and not treeDirty
            unless changelogUpdated
                console.error 'Error: Changelog must be updated!'

            if treeDirty
                console.error 'Error: Tree must not be dirty!'

            exit 1

    target.bundle()

    # Add everything
    exec 'git add thallium.js package.json CHANGELOG.md'

    # Increment the package version and get the printed version
    pkg.version = semver.inc pkg.version, increment
    JSON.stringify(pkg).to require.resolve '../package.json'

    exec "git commit --message=v#{pkg.version}"
    exec "git tag v#{pkg.version}"
    exec 'git push'
    exec 'git push --tags'
