'use strict'

###
Note: updates to this must be reflected in test/cli/common.js, as it's trying to
represent more real-world usage.
###

t = require 'thallium'
path = require 'path'
Common = require '../../../lib/cli/common'
assert = require 'thallium/assert'

t.test 'cli common', ->
    p = path.normalize

    t.test 'isObjectLike()', ->
        {isObjectLike} = Common

        t.test 'passes for objects and functions', ->
            assert.equal isObjectLike({}), true
            assert.equal isObjectLike([]), true
            assert.equal isObjectLike(->), true

        t.test 'fails for other things', ->
            assert.equal isObjectLike(''), false
            assert.equal isObjectLike('foo'), false
            assert.equal isObjectLike(true), false
            assert.equal isObjectLike(false), false
            assert.equal isObjectLike(0), false
            assert.equal isObjectLike(1), false
            assert.equal isObjectLike(NaN), false
            assert.equal isObjectLike(null), false
            assert.equal isObjectLike(undefined), false
            assert.equal isObjectLike(), false

            if typeof Symbol is 'function'
                assert.equal isObjectLike(Symbol()), false

    t.test 'resolveDefault()', ->
        {resolveDefault} = Common

        t.test 'gets CJS default functions', ->
            f = ->
            assert.equal f, resolveDefault(f)

        t.test 'gets CJS default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            assert.equal f, resolveDefault(f)

        t.test 'gets CJS default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            assert.equal array, resolveDefault(array)

        t.test 'gets CJS default objects', ->
            obj = {}
            assert.equal obj, resolveDefault(obj)

        t.test 'gets CJS default primitives', ->
            assert.equal '', resolveDefault('')
            assert.equal 'foo', resolveDefault('foo')
            assert.equal true, resolveDefault(true)
            assert.equal false, resolveDefault(false)
            assert.equal 0, resolveDefault(0)
            assert.equal 1, resolveDefault(1)
            assert.equal NaN, resolveDefault(NaN)
            assert.equal null, resolveDefault(null)
            assert.equal undefined, resolveDefault(undefined)
            assert.equal undefined, resolveDefault()

            if typeof Symbol is 'function'
                sym = Symbol()
                assert.equal sym, resolveDefault(sym)

        t.test 'gets ES6 default functions', ->
            f = ->
            assert.equal f, resolveDefault(default: f)

        t.test 'gets ES6 default objects', ->
            obj = {}
            assert.equal obj, resolveDefault(default: obj)

        t.test 'gets ES6 default arrays', ->
            array = []
            assert.equal array, resolveDefault(default: array)

        t.test 'gets ES6 default objects with `default` property', ->
            obj = default: {}
            assert.equal obj, resolveDefault(default: obj)

        t.test 'gets ES6 default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            assert.equal f, resolveDefault(default: f)

        t.test 'gets ES6 default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            assert.equal array, resolveDefault(default: array)

        t.test 'gets ES6 default primitives', ->
            assert.equal '', resolveDefault(default: '')
            assert.equal 'foo', resolveDefault(default: 'foo')
            assert.equal true, resolveDefault(default: true)
            assert.equal false, resolveDefault(default: false)
            assert.equal 0, resolveDefault(default: 0)
            assert.equal 1, resolveDefault(default: 1)
            assert.equal NaN, resolveDefault(default: NaN)
            assert.equal null, resolveDefault(default: null)
            assert.equal undefined, resolveDefault(default: undefined)

            if typeof Symbol is 'function'
                sym = Symbol()
                assert.equal sym, resolveDefault(default: sym)

    t.test 'normalizeGlob()', ->
        {normalizeGlob} = Common
        format = (str) -> str.replace /[\\\/]/g, path.sep

        check = (name, base, {file, glob, dir, negate, negateDir}) ->
            inner = ([arg, expected]) ->
                assert.equal(
                    normalizeGlob format(arg), p(base)
                    p(expected)
                )

            t.test name, ->
                t.test 'normalizes a file', -> inner file
                t.test 'normalizes a glob', -> inner glob
                t.test 'retains trailing slashes', -> inner dir
                t.test 'retains negative', -> inner negate
                t.test 'retains negative + trailing slashes', -> inner negateDir

        check 'current directory', '.',
            file: ['a', 'a']
            glob: ['a/*.js', 'a/*.js']
            dir: ['a/*/', 'a/*/']
            negate: ['!a/*', '!a/*']
            negateDir: ['!a/*/', '!a/*/']

        check 'absolute directory', __dirname,
            file: ['a', path.resolve(__dirname, 'a')]
            glob: ['a/*.js', path.resolve(__dirname, 'a/*.js')]
            dir: ['a/*/', path.resolve(__dirname, 'a/*') + '/']
            negate: ['!a/*', '!' + path.resolve(__dirname, 'a/*')]
            negateDir: ['!a/*/', '!' + path.resolve(__dirname, 'a/*') + '/']

        check 'relative directory', 'foo',
            file: ['a', 'foo/a']
            glob: ['a/*.js', 'foo/a/*.js']
            dir: ['a/*/', 'foo/a/*/']
            negate: ['!a/*', '!foo/a/*']
            negateDir: ['!a/*/', '!foo/a/*/']

        # Some of these aren't likely to ever show up, but just in case.
        t.test 'edge cases', ->
            t.test 'normalizes `.` with a cwd of `.`', ->
                assert.equal normalizeGlob('.', '.'), '.'

            t.test 'normalizes `..` with a cwd of `.`', ->
                assert.equal normalizeGlob('..', '.'), '..'

            t.test 'normalizes `.` with a cwd of `..`', ->
                assert.equal normalizeGlob('.', '..'), '..'

            t.test 'normalizes directories with a cwd of `..`', ->
                assert.equal(
                    normalizeGlob format('foo/bar'), '..'
                    p('../foo/bar')
                )

            t.test 'removes excess `.`', ->
                assert.equal(
                    normalizeGlob format('././././.'), 'foo'
                    'foo'
                )

            t.test 'removes excess `..`', ->
                assert.equal(
                    normalizeGlob format('foo/../bar/baz/..'), 'dir'
                    p('dir/bar')
                )

            t.test 'removes excess combined junk', ->
                assert.equal(
                    normalizeGlob format('foo/./bar/../baz/./what'), '.'
                    p('foo/baz/what')
                )

    t.test 'globParent()', ->
        gp = Common.globParent

        t.test 'strips glob magic to return parent path', ->
            assert.equal gp(p('path/to/*.js')), p('path/to')
            assert.equal gp(p('/root/path/to/*.js')), p('/root/path/to')
            assert.equal gp(p('/*.js')), p('/')
            assert.equal gp(p('*.js')), '.'
            assert.equal gp(p('**/*.js')), '.'
            assert.equal gp(p('path/{to,from}')), 'path'
            assert.equal gp(p('path/!(to|from)')), 'path'
            assert.equal gp(p('path/?(to|from)')), 'path'
            assert.equal gp(p('path/+(to|from)')), 'path'
            assert.equal gp(p('path/*(to|from)')), 'path'
            assert.equal gp(p('path/@(to|from)')), 'path'
            assert.equal gp(p('path/**/*')), 'path'
            assert.equal gp(p('path/**/subdir/foo.*')), 'path'

        t.test 'returns glob itself from non-glob paths', ->
            assert.equal gp(p('path/foo/bar.js')), p('path/foo/bar.js')
            assert.equal gp(p('path/foo/')), p('path/foo')
            assert.equal gp(p('path/foo')), p('path/foo')

        t.test 'gets a base name', ->
            assert.equal gp(p('js/*.js')), 'js'

        t.test 'gets a base name from a nested glob', ->
            assert.equal gp(p('js/**/test/*.js')), 'js'

        t.test 'gets a base name from a flat file', ->
            assert.equal gp(p('js/test/wow.js')), p('js/test/wow.js')

        t.test 'gets a base name from character class pattern', ->
            assert.equal gp(p('js/t[a-z]st}/*.js')), 'js'

        t.test 'gets a base name from brace , expansion', ->
            assert.equal gp(p('js/{src,test}/*.js')), 'js'

        t.test 'gets a base name from brace .. expansion', ->
            assert.equal gp(p('js/test{0..9}/*.js')), 'js'

        t.test 'gets a base name from extglob', ->
            assert.equal gp(p('js/t+(wo|est)/*.js')), 'js'

        t.test 'gets a base name from a complex brace glob', ->
            assert.equal(
                gp p('lib/{components,pages}/**/{test,another}/*.txt')
                'lib'
            )
            assert.equal(
                gp p('js/test/**/{images,components}/*.js')
                p('js/test')
            )
            assert.equal(
                gp p('ooga/{booga,sooga}/**/dooga/{eooga,fooga}')
                'ooga'
            )
