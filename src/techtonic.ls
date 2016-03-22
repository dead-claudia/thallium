'use strict'

require! {
    './messages': {m}

    './assertion-error': {AssertionError}
    './util/inspect': {inspect}

    './test/base-test': {BaseTest}
    './test/inline-test': {InlineTest}
    './test/block-test': {BlockTest}
    './test/dummy-test': dummy
    './test/skip-test': skip
    './test/async-test': {AsyncTest, getTimeout}

    './test/common': {activeReporters}
    './util/util': {bind}
    './only': {Only}
}

checkInit = (ctx) ->
    unless ctx.initializing
        throw new ReferenceError m 'fail.checkInit'

/**
 * Factory for creating Techtonic instances.
 */
export class Techtonic
    -> @_ = new BaseTest @

    /**
     * Exposed for testing, but might be interesting for consumers.
     */
    base: -> new Techtonic

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only: ->
        checkInit @_
        @_.only = new Only

        for selector, i in &
            unless Array.isArray selector
                throw new TypeError m 'type.only.index', i
            @_.only.add selector

        @

    # This is used to pull the common part out of `do()` and `block()`, so if
    # one's changed, the other still has the correct implementation.
    doBlock = (func) ->
        unless typeof func == 'function'
            throw new TypeError m 'type.any.callback'

        checkInit @_

        if @_.inline
            @_.inline.push run: func, args: []
        else
            func!

        @

    /**
     * Run `func` when tests are run. This is synchronous for block and async
     * tests, but not inline tests. It's probably most useful for plugin
     * authors.
     *
     * Returns the current instance for chaining.
     */
    do: doBlock

    /**
     * ES3-compatible alias of `t.do()`. Does exactly the same thing.
     */
    block: doBlock

    # This handles possibly nested arrays of arguments.
    iterateCall = (message, func) ->
        iterate = !->
            for arg in &
                if Array.isArray arg
                    iterate.apply @, arg
                else if typeof func == 'function'
                    func.call @, arg
                else
                    throw new TypeError m message
        ->
            checkInit @_
            iterate ...
            @

    /**
     * Use a number of plugins. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    use: iterateCall 'type.plugin', (plugin) !->
        if (@_.plugins.indexOf plugin) < 0
            # Add plugin before calling it.
            @_.plugins.push plugin
            plugin.call @, @

    /**
     * Add a number of reporters. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    reporter: iterateCall 'type.reporter', (reporter) !->
        | not @_.reporters? => @_.reporters = [reporter]
        | @_.reporters.indexOf(reporter) < 0 => @_.reporters.push reporter

    # This handles name + func vs object with methods.
    makeSetterCheck = (func, name) ->
        | typeof func == 'function' => func
        | otherwise => throw new TypeError m 'type.define.callback', name

    makeSetter = (iterator) -> (name, func) ->
        checkInit @_

        if typeof name == 'object'
            for own key of name
                iterator.call @, key, makeSetterCheck name[key], key
        else
            iterator.call @, name, makeSetterCheck func, name

        @

    # This formats the assertion error messages.
    format = (obj) ->
        | not obj.message => 'unspecified'
        | otherwise =>
            obj.message.replace /(.?)\{(.+?)\}/g, (m, pre, prop) ->
                | pre == '\\' => m.slice(1)
                | Object::hasOwnProperty.call obj, prop =>
                    pre + inspect obj[prop]
                | otherwise => m

    /**
     * Define one or more (if an object is passed) assertions.
     *
     * Returns the current instance for chaining.
     */
    define: makeSetter (name, func) !->
        run = ->
            res = func.apply void, &

            unless typeof res == 'object' and res?
                throw new TypeError m 'type.define.return', name

            unless res.test
                throw new AssertionError (format res), res.expected, res.actual

        @[name] = ->
            checkInit @_
            if @_.inline
                @_.inline.push run: run, args: [.. for &]
            else
                run ...&
            @

    /**
     * Wrap one or more (if an object is passed) existing methods.
     *
     * Returns the current instance for chaining.
     */
    wrap: makeSetter (name, func) !->
        unless typeof (old = @[name]) == 'function'
            throw new TypeError m 'missing.wrap.callback', name

        @[name] = ->
            checkInit @._
            ret = func.apply void, [old `bind` @] ++ [.. for &]
            if ret != void then ret else @

    /**
     * Define one or more (if an object is passed) new methods.
     *
     * Returns the current instance for chaining.
     */
    add: makeSetter (name, func) !->
        @[name] = ->
            checkInit @._
            ret = func.apply @, [@] ++ [.. for &]
            if ret != void then ret else @

    /**
     * If an argument was passed, this sets the timeout in milliseconds,
     * rounding negatives to 0, and returns the current instance for chaining.
     * Setting the timeout to 0 means to inherit the parent timeout, and setting
     * it to `Infinity` disables it.
     *
     * Otherwise, it returns the active (not necessarily own) timeout, or the
     * framework default of 2000 milliseconds.
     */
    timeout: (timeout) ->
        | timeout? =>
            checkInit @_
            timeout = 0 if timeout < 0
            @_.timeout = timeout
            @
        | otherwise => getTimeout @_

    /**
     * Get the parent test. Mostly useful for plugin authors.
     */
    parent: ->
        | @_.isBase => void
        | otherwise => @_.parent.methods

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used by plugin authors if a test method
     * modifies state. If you use `define`, `wrap` or `add`, this is already
     * done for you.
     *
     * Returns the current instance for chaining.
     */
    checkInit: ->
        checkInit @_
        @

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run: (callback) ->
        unless typeof callback == 'function' or not callback?
            throw new TypeError m 'type.callback.optional'

        checkInit @_

        if @_.running
            throw new Error m 'run.concurrent'

        @_.run true
        .bind void .return void # So it's returning the right thing.
        .asCallback callback

    # This checks if the test was whitelisted in a `t.only()` call, or for
    # convenience, returns `true` if `t.only()` was never called.
    isOnly = (test, name) ->
        path = [name]

        # This gets the path in reverse order. A FIFO stack is appropriate here.
        until test.only? or test.isBase
            path.push test.name
            test = test.parent

        # If no `only` is active, then anything works.
        not test.only? or test.only.check path

    runTest = (namespace) -> (name, callback) ->
        checkInit @_

        unless typeof name == 'string'
            throw new TypeError m 'type.test.name'

        unless typeof callback == 'function' or not callback?
            throw new TypeError m 'type.callback.optional'

        ns = if isOnly @_, name then namespace else dummy
        index = @_.tests.length

        if callback?
            @_.tests.push new ns.BlockTest @, name, index, callback
            @
        else
            @_.tests.push t = new ns.InlineTest @, name, index
            t.methods

    /**
     * Add a skipped block or inline test.
     */
    testSkip: runTest skip

    /**
     * Add a block or inline test.
     */
    test: runTest {InlineTest, BlockTest}

    runAsync = (Test) -> (name, callback) ->
        unless typeof name == 'string'
            throw new TypeError m 'type.test.name'

        unless typeof callback == 'function'
            throw new TypeError m 'type.async.callback'

        checkInit @_

        T = if isOnly @_, name then Test else dummy.BlockTest
        index = @_.tests.length

        @_.tests.push new T @, name, index, callback

    /**
     * Add a skipped async test.
     */
    asyncSkip: runAsync skip.BlockTest

    /**
     * Add an async test.
     */
    async: runAsync AsyncTest

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    reporters: -> activeReporters @_ .slice!

    /**
     * Check if this is an inline test. Mostly useful for plugin authors.
     */
    inline: -> @_.inline

    # Export the AssertionError constructor
    AssertionError: AssertionError
