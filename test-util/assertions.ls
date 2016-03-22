'use strict'

require! '../src/index': {t}

export fail = (name, ...args) -> t.throws (-> t[name] ...args), t.AssertionError
export basic = (desc, callback) -> suite desc, -> test 'works', callback
