'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'cli common', ->
    @test 'isObjectLike()', ->
        @testSkip 'passes for objects and functions'
        @testSkip 'fails for other things'

    @test 'resolveDefault()', ->
        @testSkip 'gets CJS default functions'
        @testSkip 'gets CJS default functions with `default` property'
        @testSkip 'gets CJS default arrays with `default` property'
        @testSkip 'gets CJS default objects'
        @testSkip 'gets CJS default primitives'
        @testSkip 'gets ES6 default functions'
        @testSkip 'gets ES6 default objects'
        @testSkip 'gets ES6 default arrays'
        @test 'gets ES6 default objects with `default` property', fail
        @test 'gets ES6 default functions with `default` property', fail
        @test 'gets ES6 default arrays with `default` property', fail
        @testSkip 'gets ES6 default primitives'

    @test 'normalizeGlob()', ->
        @test 'current directory', ->
            @testSkip 'normalizes a file'
            @testSkip 'normalizes a glob'
            @testSkip 'retains trailing slashes'
            @testSkip 'retains negative'
            @testSkip 'retains negative + trailing slashes'

        @test 'absolute directory', ->
            @testSkip 'normalizes a file'
            @testSkip 'normalizes a glob'
            @testSkip 'retains trailing slashes'
            @testSkip 'retains negative'
            @testSkip 'retains negative + trailing slashes'

        @test 'relative directory', ->
            @testSkip 'normalizes a file'
            @testSkip 'normalizes a glob'
            @testSkip 'retains trailing slashes'
            @testSkip 'retains negative'
            @testSkip 'retains negative + trailing slashes'

        @test 'edge cases', ->
            @testSkip 'normalizes `.` with a cwd of `.`'
            @testSkip 'normalizes `..` with a cwd of `.`'
            @testSkip 'normalizes `.` with a cwd of `..`'
            @test 'normalizes directories with a cwd of `..`', fail
            @testSkip 'removes excess `.`'
            @testSkip 'removes excess `..`'
            @testSkip 'removes excess combined junk'

    @test 'globParent()', ->
        @testSkip 'strips glob magic to return parent path'
        @testSkip 'returns parent dirname from non-glob paths'
        @testSkip 'gets a base name'
        @testSkip 'gets a base name from a nested glob'
        @testSkip 'gets a base name from a flat file'
        @testSkip 'gets a base name from character class pattern'
        @testSkip 'gets a base name from brace , expansion'
        @testSkip 'gets a base name from brace .. expansion'
        @test 'gets a base name from extglob', fail
        @test 'gets a base name from a complex brace glob', fail
