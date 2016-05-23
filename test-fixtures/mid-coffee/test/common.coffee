'use strict'

###
Note: updates to this must be reflected in test/cli/common.js, as it's trying to
represent more real-world usage.
###

t = require 'thallium'
path = require 'path'
Common = require '../../../lib/cli/common.js'

p = (str) -> str.replace /[\\\/]/g, path.sep

t.test 'cli common', ->
    @test 'isObjectLike()', ->
        {isObjectLike} = Common

        @test 'passes for objects and functions', ->
            @true isObjectLike({})
            @true isObjectLike([])
            @true isObjectLike(->)

        @test 'fails for other things', ->
            @false isObjectLike('')
            @false isObjectLike('foo')
            @false isObjectLike(true)
            @false isObjectLike(false)
            @false isObjectLike(0)
            @false isObjectLike(1)
            @false isObjectLike(NaN)
            @false isObjectLike(null)
            @false isObjectLike(undefined)
            @false isObjectLike()
            @false isObjectLike(Symbol()) if typeof Symbol is 'function'

    @test 'resolveDefault()', ->
        {resolveDefault} = Common

        @test 'gets CJS default functions', ->
            f = ->
            @equal f, resolveDefault(f)

        @test 'gets CJS default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            @equal f, resolveDefault(f)

        @test 'gets CJS default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            @equal array, resolveDefault(array)

        @test 'gets CJS default objects', ->
            obj = {}
            @equal obj, resolveDefault(obj)

        @test 'gets CJS default primitives', ->
            @equal '', resolveDefault('')
            @equal 'foo', resolveDefault('foo')
            @equal true, resolveDefault(true)
            @equal false, resolveDefault(false)
            @equal 0, resolveDefault(0)
            @equal 1, resolveDefault(1)
            @equal NaN, resolveDefault(NaN)
            @equal null, resolveDefault(null)
            @equal undefined, resolveDefault(undefined)
            @equal undefined, resolveDefault()

            if typeof Symbol is 'function'
                sym = Symbol()
                @equal sym, resolveDefault(sym)

        @test 'gets ES6 default functions', ->
            f = ->
            @equal f, resolveDefault(default: f)

        @test 'gets ES6 default objects', ->
            obj = {}
            @equal obj, resolveDefault(default: obj)

        @test 'gets ES6 default arrays', ->
            array = []
            @equal array, resolveDefault(default: array)

        @test 'gets ES6 default objects with `default` property', ->
            obj = default: {}
            @equal obj, resolveDefault(default: obj)

        @test 'gets ES6 default functions with `default` property', ->
            f = ->
            f.default = 'foo'
            @equal f, resolveDefault(default: f)

        @test 'gets ES6 default arrays with `default` property', ->
            array = []
            array.default = 'foo'
            @equal array, resolveDefault(default: array)

        @test 'gets ES6 default primitives', ->
            @equal '', resolveDefault(default: '')
            @equal 'foo', resolveDefault(default: 'foo')
            @equal true, resolveDefault(default: true)
            @equal false, resolveDefault(default: false)
            @equal 0, resolveDefault(default: 0)
            @equal 1, resolveDefault(default: 1)
            @equal NaN, resolveDefault(default: NaN)
            @equal null, resolveDefault(default: null)
            @equal undefined, resolveDefault(default: undefined)

            if typeof Symbol is 'function'
                sym = Symbol()
                @equal sym, resolveDefault(default: sym)

    @test 'normalizeGlob()', ->
        {normalizeGlob} = Common

        @add 'check', (_, name, base, {file, glob, dir, negate, negateDir}) ->
            @test name, ->
                @test 'normalizes a file', ->
                    @equal normalizeGlob(file[0], base), p(file[1])

                @test 'normalizes a glob', ->
                    @equal normalizeGlob(glob[0], base), p(glob[1])

                @test 'retains trailing slashes', ->
                    @equal normalizeGlob(dir[0], base), p(dir[1])

                @test 'retains negative', ->
                    @equal normalizeGlob(negate[0], base), p(negate[1])

                @test 'retains negative + trailing slashes', ->
                    @equal normalizeGlob(negateDir[0], base), p(negateDir[1])

        @check 'current directory', '.',
            file: ['a', 'a']
            glob: ['a/*.js', 'a/*.js']
            dir: ['a/*/', 'a/*/']
            negate: ['!a/*', '!a/*']
            negateDir: ['!a/*/', '!a/*/']

        @check 'absolute directory', __dirname,
            file: ['a', path.resolve(__dirname, 'a')]
            glob: ['a/*.js', path.resolve(__dirname, 'a/*.js')]
            dir: ['a/*/', path.resolve(__dirname, 'a/*') + '/']
            negate: ['!a/*', '!' + path.resolve(__dirname, 'a/*')]
            negateDir: ['!a/*/', '!' + path.resolve(__dirname, 'a/*') + '/']

        @check 'relative directory', 'foo',
            file: ['a', 'foo/a']
            glob: ['a/*.js', 'foo/a/*.js']
            dir: ['a/*/', 'foo/a/*/']
            negate: ['!a/*', '!foo/a/*']
            negateDir: ['!a/*/', '!foo/a/*/']

        # Some of these aren't likely to ever show up, but just in case.
        @test 'edge cases', ->
            @test 'normalizes `.` with a cwd of `.`', ->
                @equal normalizeGlob('.', '.'), '.'

            @test 'normalizes `..` with a cwd of `.`', ->
                @equal normalizeGlob('..', '.'), '..'

            @test 'normalizes `.` with a cwd of `..`', ->
                @equal normalizeGlob('.', '..'), '..'

            @test 'normalizes directories with a cwd of `..`', ->
                @equal normalizeGlob('foo/bar', '..'), '../foo/bar'

            @test 'removes excess `.`', ->
                @equal normalizeGlob('././././.', 'foo'), 'foo'

            @test 'removes excess `..`', ->
                @equal normalizeGlob('foo/../bar/baz/..', 'dir'), 'dir/bar'

            @test 'removes excess combined junk', ->
                @equal normalizeGlob('foo/./bar/../baz/./what', '.'),
                    'foo/baz/what'

    @test 'globParent()', ->
        gp = Common.globParent

        @test 'strips glob magic to return parent path', ->
            @equal gp('path/to/*.js'), 'path/to'
            @equal gp('/root/path/to/*.js'), '/root/path/to'
            @equal gp('/*.js'), '/'
            @equal gp('*.js'), '.'
            @equal gp('**/*.js'), '.'
            @equal gp('path/{to,from}'), 'path'
            @equal gp('path/!(to|from)'), 'path'
            @equal gp('path/?(to|from)'), 'path'
            @equal gp('path/+(to|from)'), 'path'
            @equal gp('path/*(to|from)'), 'path'
            @equal gp('path/@(to|from)'), 'path'
            @equal gp('path/**/*'), 'path'
            @equal gp('path/**/subdir/foo.*'), 'path'

        @test 'returns parent dirname from non-glob paths', ->
            @equal gp('path/foo/bar.js'), 'path/foo'
            @equal gp('path/foo/'), 'path/foo'
            @equal gp('path/foo'), 'path'

        @test 'gets a base name', ->
            @equal gp('js/*.js') + '/', 'js/'

        @test 'gets a base name from a nested glob', ->
            @equal gp('js/**/test/*.js') + '/', 'js/'

        @test 'gets a base name from a flat file', ->
            @equal gp('js/test/wow.js') + '/', 'js/test/'

        @test 'gets a base name from character class pattern', ->
            @equal gp('js/t[a-z]st}/*.js') + '/', 'js/'

        @test 'gets a base name from brace , expansion', ->
            @equal gp('js/{src,test}/*.js') + '/', 'js/'

        @test 'gets a base name from brace .. expansion', ->
            @equal gp('js/test{0..9}/*.js') + '/', 'js/'

        @test 'gets a base name from extglob', ->
            @equal gp('js/t+(wo|est)/*.js') + '/', 'js/'

        @test 'gets a base name from a complex brace glob', ->
            @equal gp('lib/{components,pages}/**/{test,another}/*.txt') + '/',
                'lib/'
            @equal gp('js/test/**/{images,components}/*.js') + '/', 'js/test/'
            @equal gp('ooga/{booga,sooga}/**/dooga/{eooga,fooga}') + '/',
                'ooga/'
