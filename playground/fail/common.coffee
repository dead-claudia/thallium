'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'cli common', ->
    @test 'isObjectLike()', ->
        @test 'passes for objects and functions', fail
        @test 'fails for other things', fail

    @test 'resolveDefault()', ->
        @test 'gets CJS default functions', fail
        @test 'gets CJS default functions with `default` property', fail
        @test 'gets CJS default arrays with `default` property', fail
        @test 'gets CJS default objects', fail
        @test 'gets CJS default primitives', fail
        @test 'gets ES6 default functions', fail
        @test 'gets ES6 default objects', fail
        @test 'gets ES6 default arrays', fail
        @test 'gets ES6 default objects with `default` property', fail
        @test 'gets ES6 default functions with `default` property', fail
        @test 'gets ES6 default arrays with `default` property', fail
        @test 'gets ES6 default primitives', fail

    @test 'normalizeGlob()', ->
        @test 'current directory', ->
            @test 'normalizes a file', fail
            @test 'normalizes a glob', fail
            @test 'retains trailing slashes', fail
            @test 'retains negative', fail
            @test 'retains negative + trailing slashes', fail

        @test 'absolute directory', ->
            @test 'normalizes a file', fail
            @test 'normalizes a glob', fail
            @test 'retains trailing slashes', fail
            @test 'retains negative', fail
            @test 'retains negative + trailing slashes', fail

        @test 'relative directory', ->
            @test 'normalizes a file', fail
            @test 'normalizes a glob', fail
            @test 'retains trailing slashes', fail
            @test 'retains negative', fail
            @test 'retains negative + trailing slashes', fail

        @test 'edge cases', ->
            @test 'normalizes `.` with a cwd of `.`', fail
            @test 'normalizes `..` with a cwd of `.`', fail
            @test 'normalizes `.` with a cwd of `..`', fail
            @test 'normalizes directories with a cwd of `..`', fail
            @test 'removes excess `.`', fail
            @test 'removes excess `..`', fail
            @test 'removes excess combined junk', fail

    @test 'globParent()', ->
        @test 'strips glob magic to return parent path', fail
        @test 'returns parent dirname from non-glob paths', fail
        @test 'gets a base name', fail
        @test 'gets a base name from a nested glob', fail
        @test 'gets a base name from a flat file', fail
        @test 'gets a base name from character class pattern', fail
        @test 'gets a base name from brace , expansion', fail
        @test 'gets a base name from brace .. expansion', fail
        @test 'gets a base name from extglob', fail
        @test 'gets a base name from a complex brace glob', fail
