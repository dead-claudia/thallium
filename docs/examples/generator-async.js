// A wrapper to use generator functions as async test bodies. This effectively
// backports a former 0.2 feature, but is something relatively easy to do if you
// need it.
//
// Note that this will become unnecessary as async-await gets implemented in
// engines (it's already shipping in recent Chakra and upcoming V8).

export default function coAsync(t) {
    const old = t.async

    t.async = function (name, callback) {
        return old.call(this, name, /** @this */ function (...args) {
            const gen = callback.apply(this, args)

            if (typeof gen.next !== "function") return gen

            /**
             * This is a modified version of the async-await official,
             * non-normative desugaring helper, for better error checking and
             * adapted to accept an already-instantiated iterator instead of a
             * generator.
             */
            function iterate({done, value}) {
                // finished with success, resolve the promise
                if (done) return Promise.resolve(value)

                // not finished, chain off the yielded promise and step again
                return Promise.resolve(value).then(
                    v => iterate(gen.next(v)),
                    e => {
                        if (typeof gen.throw === "function") {
                            return iterate(gen.throw(e))
                        } else {
                            throw e
                        }
                    })
            }

            return iterate(gen.next(undefined))
        })
    }
}
