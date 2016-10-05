# A wrapper to use generator functions as async test bodies. This effectively
# backports a former 0.2 feature, but is something relatively easy to do if you
# need it.
#
# Note that this will become unnecessary as async-await gets implemented in
# engines (it's already shipping in recent Chakra and upcoming V8).

module.exports = ->
    @async = do (old = @async) -> (name, callback) ->
        old.call this, name, ->
            gen = callback.apply this, arguments
            return gen unless typeof gen.next is 'function'

            # This is a modified version of the async-await official,
            # non-normative desugaring helper, for better error checking and
            # adapted to accept an already-instantiated iterator instead of a
            # generator.
            iterate = ({done, value}) ->
                # finished with success, resolve the promise
                if done then value else
                    # not finished, chain off the yielded promise and step again
                    Promise.resolve(value).then(
                        (v) -> iterate gen.next(v)
                        (e) ->
                            throw e unless typeof gen.throw is 'function'
                            iterate gen.throw(e)
                    )

            iterate gen.next(undefined)
