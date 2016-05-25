'use strict'

t = require '../../index.js'

t.test 'cli common', ->
    @test 'isObjectLike()', ->
        @test 'passes for objects and functions', ->
        @test 'fails for other things', ->

    @test 'resolveDefault()', ->
        @test 'gets CJS default functions', ->
        @test 'gets CJS default functions with `default` property', ->
        @test 'gets CJS default arrays with `default` property', ->
        @test 'gets CJS default objects', ->
        @test 'gets CJS default primitives', ->
        @test 'gets ES6 default functions', ->
        @test 'gets ES6 default objects', ->
        @test 'gets ES6 default arrays', ->
        @testSkip 'gets ES6 default objects with `default` property'
        @testSkip 'gets ES6 default functions with `default` property'
        @testSkip 'gets ES6 default arrays with `default` property'
        @test 'gets ES6 default primitives', ->

    @test 'normalizeGlob()', ->
        @test 'current directory', ->
            @test 'normalizes a file', ->
            @test 'normalizes a glob', ->
            @test 'retains trailing slashes', ->
            @test 'retains negative', ->
            @test 'retains negative + trailing slashes', ->

        @test 'absolute directory', ->
            @test 'normalizes a file', ->
            @test 'normalizes a glob', ->
            @test 'retains trailing slashes', ->
            @test 'retains negative', ->
            @test 'retains negative + trailing slashes', ->

        @test 'relative directory', ->
            @test 'normalizes a file', ->
            @test 'normalizes a glob', ->
            @test 'retains trailing slashes', ->
            @test 'retains negative', ->
            @test 'retains negative + trailing slashes', ->

        @test 'edge cases', ->
            @test 'normalizes `.` with a cwd of `.`', ->
            @test 'normalizes `..` with a cwd of `.`', ->
            @test 'normalizes `.` with a cwd of `..`', ->
            @testSkip 'normalizes directories with a cwd of `..`'
            @test 'removes excess `.`', ->
            @test 'removes excess `..`', ->
            @test 'removes excess combined junk', ->

    @test 'globParent()', ->
        @test 'strips glob magic to return parent path', ->
        @test 'returns parent dirname from non-glob paths', ->
        @test 'gets a base name', ->
        @test 'gets a base name from a nested glob', ->
        @test 'gets a base name from a flat file', ->
        @test 'gets a base name from character class pattern', ->
        @test 'gets a base name from brace , expansion', ->
        @test 'gets a base name from brace .. expansion', ->
        @testSkip 'gets a base name from extglob'
        @testSkip 'gets a base name from a complex brace glob'
