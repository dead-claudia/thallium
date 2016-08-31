'use strict'

t = require 'thallium'
t.reporter require '../../scripts/pipe-reporter.js'
require('../../lib/tests.js').silenceEmptyInlineWarnings()

exports.files = 'spec/**/*.coffee'
