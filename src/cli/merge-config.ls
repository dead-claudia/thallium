'use strict'

require! '../messages': {m}

/**
 * Here's a TypeScript-like description of the expected config export (after
 * being resolved as a possible thenable):
 *
 * ```ts
 * interface Config {
 *     // Techtonic module name, defaults to `techtonic`
 *     module?: string;
 *
 *     // Techtonic instance, defaults to `require('techtonic')`
 *     techtonic?: string;
 *
 *     // List of file globs to add.
 *     files?: string | string[];
 * }
 * ```
 *
 * Note that `files` are overridable by the command line. `module` is ignored
 * when `techtonic` is passed, but is still validated.
 */

hasOwn = Object::hasOwnProperty

# Exported for testing.
export validate = (config) ->
    ret = {}

    check = (field, run) ->
        ret[field] = run config[field] if hasOwn.call config, field

    simple = (field, type, test) -> check field, (value) ->
        | test value => value
        | otherwise =>
            throw new TypeError m 'type.cli.config', field, type, typeof value

    simple 'module', 'string', -> typeof it == 'string'
    simple 'techtonic', 'object', ->
        typeof it == 'object' and it != null and not Array.isArray it

    check 'files', (files) ->
        | Array.isArray files =>
            for glob, i in files | typeof glob != 'string'
                throw new TypeError m 'type.cli.config.files', i, glob
            files
        | typeof files == 'string' => [files]
        | otherwise =>
            throw new TypeError do
                m 'type.cli.config', 'files', 'string or array', typeof files

    ret

/**
 * Merge the arguments from parseArgs with the given JSON config.
 *
 * Note that `load` is a hook for mocks. During normal execution, it's set to
 * a version of `require` loading relative to the current working directory.
 */
export merge = (files, config, load) ->
    checked = validate config

    techtonic: checked.techtonic ? load checked.module ? 'techtonic'
    files: files.slice!concat checked.files ? []
