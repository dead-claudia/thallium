'use strict'

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
require! {
    './techtonic': {Techtonic}
    './assertions': {assertions}
}

export t = new Techtonic!use assertions
