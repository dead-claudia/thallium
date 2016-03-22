'use strict'

require! {
    '../../../src/index': {t}
    '../../../src/cli/merge-config': {merge}
}

suite 'cli config (merging)', !->
    load = ({module = 'techtonic', techtonic = {}} = {}) -> (name) ->
        t.equal name, module
        techtonic

    test 'merges an empty object', !->
        # Mark this for more useful assertion messages
        techtonic = {+techtonic}
        files = ['test/**']
        config = merge files, {}, load {techtonic}

        t.deepEqual config, {techtonic, files}
        t.equal config.techtonic, techtonic

    test 'merges `module`', !->
        # Mark this for more useful assertion messages
        techtonic = {+techtonic}
        files = ['test/**']
        module = './some-techtonic-wrapper'
        config = merge files, {module}, load {module, techtonic}

        t.deepEqual config, {techtonic, files}
        t.equal config.techtonic, techtonic

    test 'merges `techtonic`', !->
        # Mark this for more useful assertion messages
        techtonic = {+techtonic}
        files = ['test/**']
        config = merge files, {techtonic}, load!

        t.deepEqual config, {techtonic, files}
        t.equal config.techtonic, techtonic

    test 'merges `files`', !->
        # Mark this for more useful assertion messages
        techtonic = {+techtonic}
        files = ['test/**']
        extra = ['other/**']
        config = merge files, {files: extra}, load {techtonic}

        t.deepEqual config, {techtonic, files: files ++ extra}
        t.equal config.techtonic, techtonic

    test 'merges everything', !->
        # Mark this for more useful assertion messages
        techtonic = {+techtonic}
        module = './some-techtonic-wrapper'
        files = ['test/**']
        extra = ['other/**']
        config = merge files, {
            module, techtonic,
            files: extra,
        }, load {module}

        t.deepEqual config, {techtonic, files: files ++ extra}
        t.equal config.techtonic, techtonic
