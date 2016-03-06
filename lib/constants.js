"use strict"

// In milliseconds
exports.DEFAULT_TIMEOUT = 2000

exports.messages = {
    /* eslint-disable max-len */

    unsafeInitCall: "It is only safe to call test methods during initialization",
    unsafeRun: "Can't run the same test concurrently",
    makeSetterName: "name must be a string if func exists",
    // badOnlyType: "Expected the only path to be either all arrays or all strings",
    testName: "Expected name to be a string",
    testCallback: "Expected callback to be a function or not exist",
    asyncCallback: "Expected callback to be a function or generator",
    runCallback: "Expected callback to be a function",
    pluginImpl: "Expected plugin to be a function",
    reporterImpl: "Expected reporter to be a function",
    iteratorNext: "Iterator next() must return an object",
    iteratorThrow: "Iterator throw() must return an object",
    iteratorReturn: "Iterator return() must return an object",

    /* eslint-enable max-len */
}

exports.templates = {
    defineBadImplType: function (name) {
        return "Expected body of t." + name + " to be a function"
    },

    defineBadReturnType: function (name) {
        return "Expected result for t." + name + " to be an object"
    },

    wrapMissingMethod: function (name) {
        return "Expected t." + name + " to already be a function"
    },

    timeoutFail: function (timeout) {
        return "Timeout of " + timeout + " reached"
    },

    onlyType: function (index) {
        return "Expected argument " + index + " to be an array."
    },
}
