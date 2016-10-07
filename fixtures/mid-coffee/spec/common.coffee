'use strict'

###
Note: updates to this must be reflected in test/cli/common.js, as it's trying to
represent more real-world usage.
###

t = require 'thallium'
path = require 'path'
Common = require '../../../lib/cli/common.js'
assert = require 'thallium/assert'

p = (str) -> str.replace /[\\\/]/g, path.sep

t.test 'cli common', ->
    @test 'isObjectLike()', ->
        {isObjectLike} = Common

        @test 'passes for objects and functions', ->
            assert.equal isObjectLike({}), true
            assert.equal isObjectLike([]), true
            assert.equal isObjectLike(->), true

        @test 'fails for other things', ->
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

    @test 'resolveDefault()', ->
        {resolveDefault} = Common

        @test 'gets CJS default functions', ->
            f = ->
            assert.equal f, resolveDefault(f)

        @test 'gets CJS default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            assert.equal f, resolveDefault(f)

        @test 'gets CJS default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            assert.equal array, resolveDefault(array)

        @test 'gets CJS default objects', ->
            obj = {}
            assert.equal obj, resolveDefault(obj)

        @test 'gets CJS default primitives', ->
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

        @test 'gets ES6 default functions', ->
            f = ->
            assert.equal f, resolveDefault(default: f)

        @test 'gets ES6 default objects', ->
            obj = {}
            assert.equal obj, resolveDefault(default: obj)

        @test 'gets ES6 default arrays', ->
            array = []
            assert.equal array, resolveDefault(default: array)

        @test 'gets ES6 default objects with `default` property', ->
            obj = default: {}
            assert.equal obj, resolveDefault(default: obj)

        @test 'gets ES6 default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            assert.equal f, resolveDefault(default: f)

        @test 'gets ES6 default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            assert.equal array, resolveDefault(default: array)

        @test 'gets ES6 default primitives', ->
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

    @test 'normalizeGlob()', ->
        {normalizeGlob} = Common

        check = (name, base, {file, glob, dir, negate, negateDir}) =>
            @test name, ->
                @test 'normalizes a file', ->
                    assert.equal normalizeGlob(file[0], base), p(file[1])

                @test 'normalizes a glob', ->
                    assert.equal normalizeGlob(glob[0], base), p(glob[1])

                @test 'retains trailing slashes', ->
                    assert.equal normalizeGlob(dir[0], base), p(dir[1])

                @test 'retains negative', ->
                    assert.equal normalizeGlob(negate[0], base), p(negate[1])

                @test 'retains negative + trailing slashes', ->
                    assert.equal normalizeGlob(negateDir[0], base),
                        p(negateDir[1])

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
        @test 'edge cases', ->
            @test 'normalizes `.` with a cwd of `.`', ->
                assert.equal normalizeGlob('.', '.'), '.'

            @test 'normalizes `..` with a cwd of `.`', ->
                assert.equal normalizeGlob('..', '.'), '..'

            @test 'normalizes `.` with a cwd of `..`', ->
                assert.equal normalizeGlob('.', '..'), '..'

            @test 'normalizes directories with a cwd of `..`', ->
                assert.equal normalizeGlob('foo/bar', '..'), '../foo/bar'

            @test 'removes excess `.`', ->
                assert.equal normalizeGlob('././././.', 'foo'), 'foo'

            @test 'removes excess `..`', ->
                assert.equal normalizeGlob('foo/../bar/baz/..', 'dir'),
                    'dir/bar'

            @test 'removes excess combined junk', ->
                assert.equal normalizeGlob('foo/./bar/../baz/./what', '.'),
                    'foo/baz/what'

    @test 'globParent()', ->
        gp = Common.globParent

        @test 'strips glob magic to return parent path', ->
            assert.equal gp('path/to/*.js'), 'path/to'
            assert.equal gp('/root/path/to/*.js'), '/root/path/to'
            assert.equal gp('/*.js'), '/'
            assert.equal gp('*.js'), '.'
            assert.equal gp('**/*.js'), '.'
            assert.equal gp('path/{to,from}'), 'path'
            assert.equal gp('path/!(to|from)'), 'path'
            assert.equal gp('path/?(to|from)'), 'path'
            assert.equal gp('path/+(to|from)'), 'path'
            assert.equal gp('path/*(to|from)'), 'path'
            assert.equal gp('path/@(to|from)'), 'path'
            assert.equal gp('path/**/*'), 'path'
            assert.equal gp('path/**/subdir/foo.*'), 'path'

        @test 'returns glob itself from non-glob paths', ->
            assert.equal gp('path/foo/bar.js'), 'path/foo/bar.js'
            assert.equal gp('path/foo/'), 'path/foo'
            assert.equal gp('path/foo'), 'path/foo'

        @test 'gets a base name', ->
            assert.equal gp('js/*.js'), 'js'

        @test 'gets a base name from a nested glob', ->
            assert.equal gp('js/**/test/*.js'), 'js'

        @test 'gets a base name from a flat file', ->
            assert.equal gp('js/test/wow.js'), 'js/test/wow.js'

        @test 'gets a base name from character class pattern', ->
            assert.equal gp('js/t[a-z]st}/*.js'), 'js'

        @test 'gets a base name from brace , expansion', ->
            assert.equal gp('js/{src,test}/*.js'), 'js'

        @test 'gets a base name from brace .. expansion', ->
            assert.equal gp('js/test{0..9}/*.js'), 'js'

        @test 'gets a base name from extglob', ->
            assert.equal gp('js/t+(wo|est)/*.js'), 'js'

        @test 'gets a base name from a complex brace glob', ->
            assert.equal gp('lib/{components,pages}/**/{test,another}/*.txt'),
                'lib'
            assert.equal gp('js/test/**/{images,components}/*.js'), 'js/test'
            assert.equal gp('ooga/{booga,sooga}/**/dooga/{eooga,fooga}'), 'ooga'
