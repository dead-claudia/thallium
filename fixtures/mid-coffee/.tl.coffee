'use strict'

t = require 'thallium'
require('thallium/assert').inject t
t.reporter require '../../scripts/pipe-reporter.js'
require('../../lib/tests.js').silenceEmptyInlineWarnings()

exports.files = 'spec/**/*.coffee'
