"use strict"

/**
 * This merely exists so that Browserify can replace this method with the right
 * module (is-buffer).
 */

module.exports = global.Buffer.isBuffer
