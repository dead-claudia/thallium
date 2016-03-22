'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {n, p, push, a}
}

suite 'core (iterators)', !->
    suite 'raw', !->
        test 'normal', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: 5}
                    else
                        {-done, value: @index++}
                throw: -> t.fail 'should never happen'

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'normal + no `throw`', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: 5}
                    else
                        {-done, value: @index++}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'throws initially + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: [],
                index: 0,
                next: (value) ->
                    @list.push value
                    throw sentinel

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void]

        test 'throws in middle', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        throw sentinel
                throw: -> t.fail 'should never happen'

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

        test 'throws in middle + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        throw sentinel

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

    suite 'promise', !->
        resolve = (value) -> then: (resolve) -> resolve value
        reject = (value) -> then: (_, reject) -> reject value

        test 'normal', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: resolve 5}
                    else
                        {-done, value: resolve @index++}
                throw: -> t.fail 'should never happen'

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'normal + no `throw`', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: resolve 5}
                    else
                        {-done, value: resolve @index++}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'rejects initially', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    {-done, value: reject sentinel}

                throw: (value) ->
                    t.equal value, sentinel
                    {+done}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void]

        test 'rejects initially + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    {-done, value: reject sentinel}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void]

        test 'rejects in middle', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        {-done, value: reject sentinel}
                throw: (value) ->
                    t.equal value, sentinel
                    {+done}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

        test 'rejects in middle + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        {-done, value: reject sentinel}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

    # This contains most of the more edge cases.
    suite 'mixed', !->
        resolve = (value) -> then: (resolve) -> resolve value
        reject = (value) -> then: (_, reject) -> reject value

        test 'normal', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: 5}
                    else
                        {-done, value: resolve @index++}
                throw: -> t.fail 'should never happen'

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'normal + no `throw`', ->
            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index >= 5
                        {+done, value: 5}
                    else
                        {-done, value: resolve @index++}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0, 1, 2, 3, 4]

        test 'rejects initially, but returns promise', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    {-done, value: reject sentinel}
                throw: (value) ->
                    t.equal value, sentinel
                    return {done: true, value: resolve()}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void]

        test 'rejects initially + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    {-done, value: reject sentinel}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void]

        test 'rejects in middle', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        {-done, value: reject sentinel}
                throw: (value) ->
                    t.equal value, sentinel
                    {+done}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

        test 'rejects in middle, recovers rejected thenable', ->
            returned = 0
            called = 0
            sentinel1 = new Error 'sentinel1'
            sentinel1.marker = !->

            sentinel2 = new Error 'sentinel2'
            sentinel2.marker = !->

            iter =
                list: []
                index: 0
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        {-done, value: reject sentinel1}
                throw: (value) ->
                    returned++
                    t.equal(value, sentinel1)
                    done: true
                    value: then: (resolve, reject) ->
                        called++
                        reject sentinel2

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel2
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]

                t.equal returned, 1
                t.equal called, 1

        test 'rejects in middle + no `throw`', ->
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            iter =
                list: [],
                index: 0,
                next: (value) ->
                    @list.push value
                    if @index == 0
                        {-done, value: @index++}
                    else
                        {-done, value: reject sentinel}

            tt = t.base!
            ret = []

            tt.reporter push ret
            tt.async 'test', -> iter

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

                t.deepEqual iter.list, [void, 0]
