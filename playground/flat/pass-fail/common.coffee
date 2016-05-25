'use strict'

# coffeelint:disable=max_line_length

t = require '../../../index.js'

fail = -> @fail 'fail'

t.test 'cli common isObjectLike() passes for objects and functions', ->
t.test 'cli common isObjectLike() fails for other things', ->
t.test 'cli common resolveDefault() gets CJS default functions', ->
t.test 'cli common resolveDefault() gets CJS default functions with `default` property', ->
t.test 'cli common resolveDefault() gets CJS default arrays with `default` property', ->
t.test 'cli common resolveDefault() gets CJS default objects', ->
t.test 'cli common resolveDefault() gets CJS default primitives', ->
t.test 'cli common resolveDefault() gets ES6 default functions', ->
t.test 'cli common resolveDefault() gets ES6 default objects', ->
t.test 'cli common resolveDefault() gets ES6 default arrays', ->
t.test 'cli common resolveDefault() gets ES6 default objects with `default` property', fail
t.test 'cli common resolveDefault() gets ES6 default functions with `default` property', fail
t.test 'cli common resolveDefault() gets ES6 default arrays with `default` property', fail
t.test 'cli common resolveDefault() gets ES6 default primitives', ->
t.test 'cli common normalizeGlob() current directory normalizes a file', ->
t.test 'cli common normalizeGlob() current directory normalizes a glob', ->
t.test 'cli common normalizeGlob() current directory retains trailing slashes', ->
t.test 'cli common normalizeGlob() current directory retains negative', ->
t.test 'cli common normalizeGlob() current directory retains negative + trailing slashes', ->
t.test 'cli common normalizeGlob() absolute directory normalizes a file', ->
t.test 'cli common normalizeGlob() absolute directory normalizes a glob', ->
t.test 'cli common normalizeGlob() absolute directory retains trailing slashes', ->
t.test 'cli common normalizeGlob() absolute directory retains negative', ->
t.test 'cli common normalizeGlob() absolute directory retains negative + trailing slashes', ->
t.test 'cli common normalizeGlob() relative directory normalizes a file', ->
t.test 'cli common normalizeGlob() relative directory normalizes a glob', ->
t.test 'cli common normalizeGlob() relative directory retains trailing slashes', ->
t.test 'cli common normalizeGlob() relative directory retains negative', ->
t.test 'cli common normalizeGlob() relative directory retains negative + trailing slashes', ->
t.test 'cli common normalizeGlob() edge cases normalizes `.` with a cwd of `.`', ->
t.test 'cli common normalizeGlob() edge cases normalizes `..` with a cwd of `.`', ->
t.test 'cli common normalizeGlob() edge cases normalizes `.` with a cwd of `..`', ->
t.test 'cli common normalizeGlob() edge cases normalizes directories with a cwd of `..`', fail
t.test 'cli common normalizeGlob() edge cases removes excess `.`', ->
t.test 'cli common normalizeGlob() edge cases removes excess `..`', ->
t.test 'cli common normalizeGlob() edge cases removes excess combined junk', ->
t.test 'cli common globParent() strips glob magic to return parent path', ->
t.test 'cli common globParent() returns parent dirname from non-glob paths', ->
t.test 'cli common globParent() gets a base name', ->
t.test 'cli common globParent() gets a base name from a nested glob', ->
t.test 'cli common globParent() gets a base name from a flat file', ->
t.test 'cli common globParent() gets a base name from character class pattern', ->
t.test 'cli common globParent() gets a base name from brace , expansion', ->
t.test 'cli common globParent() gets a base name from brace .. expansion', ->
t.test 'cli common globParent() gets a base name from extglob', fail
t.test 'cli common globParent() gets a base name from a complex brace glob', fail
