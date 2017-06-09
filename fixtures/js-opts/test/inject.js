"use strict"

global.INJECTED = true
// Don't print anything
require("thallium").reporter = function () {}
