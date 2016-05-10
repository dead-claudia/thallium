'use strict'

t = require '../../../index.js'
path = require 'path'
normalize = require '../../../lib/cli/normalize-glob.js'

p = (str) -> str.replace /[\\\/]/g, path.sep

t.test 'cli normalize glob', ->
    @add 'check', (_, base, {file, glob, slash, negate, negateSlash}) ->
        @test 'normalizes a file', ->
            @equal normalize(file[0], base), p(file[1])

        @test 'normalizes a glob', ->
            @equal normalize(glob[0], base), p(glob[1])

        @test 'retains trailing slashes', ->
            @equal normalize(slash[0], base), p(slash[1])

        @test 'retains negative', ->
            @equal normalize(negate[0], base), p(negate[1])

        @test 'retains negative + trailing slashes', ->
            @equal normalize(negateSlash[0], base), p(negateSlash[1])

    @test('current directory').check '.',
        file: ['a', 'a']
        glob: ['a/*.js', 'a/*.js']
        slash: ['a/*/', 'a/*/']
        negate: ['!a/*', '!a/*']
        negateSlash: ['!a/*/', '!a/*/']

    @test('absolute directory').check __dirname,
        file: ['a', path.resolve(__dirname, 'a')]
        glob: ['a/*.js', path.resolve(__dirname, 'a/*.js')]
        slash: ['a/*/', "#{path.resolve(__dirname, 'a/*')}/"]
        negate: ['!a/*', "!#{path.resolve(__dirname, 'a/*')}"]
        negateSlash: ['!a/*/', "!#{path.resolve(__dirname, 'a/*')}/"]

    @test('relative directory').check 'foo',
        file: ['a', 'foo/a']
        glob: ['a/*.js', 'foo/a/*.js']
        slash: ['a/*/', 'foo/a/*/']
        negate: ['!a/*', '!foo/a/*']
        negateSlash: ['!a/*/', '!foo/a/*/']

    # Some of these aren't likely to ever show up, but just in case.
    @test 'edge cases', ->
        @test 'normalizes `.` with a cwd of `.`', ->
            @equal normalize('.', '.'), '.'

        @test 'normalizes `..` with a cwd of `.`', ->
            @equal normalize('..', '.'), '..'

        @test 'normalizes `.` with a cwd of `..`', ->
            @equal normalize('.', '..'), '..'

        @test 'normalizes directories with a cwd of `..`', ->
            @equal normalize('foo/bar', '..'), '../foo/bar'

        @test 'removes excess `.`', ->
            @equal normalize('././././.', 'foo'), 'foo'

        @test 'removes excess `..`', ->
            @equal normalize('foo/../bar/baz/..', 'dir'), 'dir/bar'

        @test 'removes excess combined junk', ->
            @equal normalize('foo/./bar/../baz/./what', '.'), 'foo/baz/what'
