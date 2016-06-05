"use strict"

/**
 * These are bit flags, to compress the test's data size by a lot. Also, it's
 * not likely tests will need more than this in a single mask.
 *
 * If you're unfamiliar about how bit masks work, here's some of the basics:
 *
 * To set a bit:   value | bit
 * To unset a bit: value & ~bit
 *
 * To test if a bit is set:   (value & bit) !== 0 or (value & bit) === bit
 * To test if a bit is unset: (value & bit) === 0
 *
 * To test if many bits are set:   (value & bits) === bits
 * To test if many bits are unset: (value & bits) === 0
 *
 * There are others, but these are the most common operations.
 */
/* eslint-disable key-spacing */

module.exports = Object.freeze({
    Inline:      0x0001, // If the test is inline, e.g. `t.test("test")`
    Async:       0x0002, // If the test is async, e.g. `t.async("test", ...)`
    Init:        0x0004, // If the test is initializing.
    Running:     0x0008, // If the test is currently running.
    Root:        0x0010, // If the test is the root test.
    HasOnly:     0x0020, // If the test has an `only` restriction.
    HasReporter: 0x0040, // If the test has its own reporters
    Skipped:     0x0080, // If the test is skipped or blacklisted by `t.only()`
    OnlyChild:   0x0100, // If the test is whitelisted by `t.only()`
    HasSkip:     0x0200, // If the test is explicitly skipped.
    Dummy:       0x0400, // If the test is inline and blacklisted by `t.only()`
})
