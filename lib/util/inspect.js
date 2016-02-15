"use strict"

/* eslint-disable max-params */

var hasOwn = {}.hasOwnProperty
var toString = {}.toString

/**
 * This code is largely derived from util-inspect by Automattic, which itself is
 * derived from Node, but there are a few differences and modifications,
 * including the fact this requires at least an ES5 shim (util-inspect is
 * ES3-compatible, and Node's util.inspect requires ES6 and internal V8 APIs).
 */

// ES6, section 24.2.3.3 - QuoteJSONString(value)
// http://www.ecma-international.org/ecma-262/6.0/#sec-quotejsonstring
//
// This deviates by returning a single-quoted string instead, because
// the rest of this uses that instead.
function quote(value) {
    // Step 1
    var product = "'"

    // Step 2 - iterate through characters
    //
    // Technically, the spec says to iterate through code points, but
    // you can safely ignore this unless you need to manipulate
    // surrogates, which isn't the case here.
    for (var i = 0; i < value.length; i++) {
        var code = value.charCodeAt(i)

        switch (code) {
        // Step 2.a
        case 0x27 /* single quote */: product += "\\'"; break
        case 0x5c /* backslash */: product += "\\\\"; break

        // Step 2.b
        case 0x08 /* backspace */: product += "\\b"; break
        case 0x0a /* newline */: product += "\\n"; break
        case 0x0b /* tab */: product += "\\t"; break
        case 0x0c /* form feed */: product += "\\f"; break
        case 0x0d /* carriage return */: product += "\\r"; break

        default:
            // Step 2.c
            if (code < 0x20 /* space */) {
                // Doing it this way so I don't have to pad the string.
                product += code < 0x10 ? "\\u000" : "\\u00"
                product += code.toString(16)
            } else {
                // Step 2.d
                product += value[i]
            }
        }
    }

    return product + "'"
}

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */

/* legacy: obj, showHidden, depth, colors*/
module.exports = inspect
function inspect(obj, opts) {
    // default options
    var ctx = {
        seen: [],
        stylize: stylizeNoColor,
    }

    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2]
    if (arguments.length >= 4) ctx.colors = arguments[3]
    if (typeof opts === "boolean") {
        // legacy...
        ctx.showHidden = opts
    } else if (opts) {
        // got an "options" object
        _extend(ctx, opts)
    }
    // set default options
    if (ctx.showHidden === undefined) ctx.showHidden = false
    if (ctx.depth === undefined) ctx.depth = 2
    if (ctx.colors === undefined) ctx.colors = false
    if (ctx.customInspect === undefined) ctx.customInspect = true
    if (ctx.colors) ctx.stylize = stylizeWithColor
    return formatValue(ctx, obj, ctx.depth)
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
var inspectColors = {
    bold: [1, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    white: [37, 39],
    grey: [90, 39],
    black: [30, 39],
    blue: [34, 39],
    cyan: [36, 39],
    green: [32, 39],
    magenta: [35, 39],
    red: [31, 39],
    yellow: [33, 39],
}

// Don't use 'blue' not visible on cmd.exe
var inspectStyles = {
    special: "cyan",
    number: "yellow",
    boolean: "yellow",
    undefined: "grey",
    null: "bold",
    string: "green",
    date: "magenta",
    // name: intentionally not styling
    regexp: "red",
}

function stylizeNoColor(str) {
    return str
}

function stylizeWithColor(str, styleType) {
    var style = inspectStyles[styleType]

    if (style) {
        return "\u001b[" + inspectColors[style][0] + "m" + str +
           "\u001b[" + inspectColors[style][1] + "m"
    } else {
        return str
    }
}

function isError(e) {
    return e != null &&
        (toString.call(e) === "[object Error]" || e instanceof Error)
}

function arrayToHash(array) {
    var hash = {}

    array.forEach(function (val) {
        hash[val] = true
    })

    return hash
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = []

    for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwn.call(value, i)) {
            output.push(formatProperty(ctx, value, recurseTimes,
                visibleKeys, String(i), true))
        } else {
            output.push("")
        }
    }

    keys.forEach(function (key) {
        if (!key.match(/^\d+$/)) {
            output.push(formatProperty(ctx, value, recurseTimes,
                visibleKeys, key, true))
        }
    })

    return output
}

var errorToString = Error.prototype.toString

function formatError(value) {
    return "[" + errorToString.call(value) + "]"
}

var regexpToString = RegExp.prototype.toString
var dateToString = Date.prototype.toString
var dateToUTCString = Date.prototype.toUTCString

function formatValue(ctx, value, recurseTimes) { // eslint-disable-line max-statements, max-len
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect &&
            value != null && typeof value.inspect === "function" &&
            // Also filter out any prototype objects using the circular
            // check.
            !(value.constructor &&
                value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx)

        if (typeof ret === "string") {
            return ret
        } else {
            return formatValue(ctx, ret, recurseTimes)
        }
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value)

    if (primitive) {
        return primitive
    }

    // Look up the keys of the object.
    var keys = Object.keys(value)
    var visibleKeys = arrayToHash(keys)

    if (ctx.showHidden && Object.getOwnPropertyNames) {
        keys = Object.getOwnPropertyNames(value)
    }

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value) &&
            (keys.indexOf("message") >= 0 ||
            keys.indexOf("description") >= 0)) {
        return formatError(value)
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
        if (typeof value === "function") {
            var name = value.name ? ": " + value.name : ""

            return ctx.stylize("[Function" + name + "]", "special")
        }
        if (toString.call(value) === "[object RegExp]") {
            return ctx.stylize(regexpToString.call(value), "regexp")
        }

        if (toString.call(value) === "[object Date]") {
            return ctx.stylize(dateToString.call(value), "date")
        }

        if (isError(value)) {
            return formatError(value)
        }
    }

    var base = ""
    var array = false
    var braces = ["{", "}"]

    // Make Array say that they are Array
    if (Array.isArray(value)) {
        array = true
        braces = ["[", "]"]
    }

    // Make functions say that they are functions
    if (typeof value === "function") {
        var n = value.name ? ": " + value.name : ""

        base = " [Function" + n + "]"
    }

    // Make RegExps say that they are RegExps
    if (toString.call(value) === "[object RegExp]") {
        base = " " + regexpToString.call(value)
    }

    // Make dates with properties first say the date
    if (toString.call(value) === "[object Date]") {
        base = " " + dateToUTCString.call(value)
    }

    // Make error with message first say the error
    if (isError(value)) {
        base = " " + formatError(value)
    }

    if (keys.length === 0 && (!array || value.length === 0)) {
        return braces[0] + base + braces[1]
    }

    if (recurseTimes < 0) {
        if (toString.call(value) === "[object RegExp]") {
            return ctx.stylize(regexpToString.call(value), "regexp")
        } else {
            return ctx.stylize("[Object]", "special")
        }
    }

    ctx.seen.push(value)

    var output

    if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys,
            keys)
    } else {
        output = keys.map(function (key) {
            return formatProperty(ctx, value, recurseTimes, visibleKeys,
                key, array)
        })
    }

    ctx.seen.pop()

    return reduceToSingleString(output, base, braces)
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) { // eslint-disable-line max-statements, max-len
    var desc = {value: value[key]}

    if (Object.getOwnPropertyDescriptor) {
        desc = Object.getOwnPropertyDescriptor(value, key) || desc
    }

    var str

    if (desc.get) {
        if (desc.set) {
            str = ctx.stylize("[Getter/Setter]", "special")
        } else {
            str = ctx.stylize("[Getter]", "special")
        }
    } else if (desc.set) {
        str = ctx.stylize("[Setter]", "special")
    }

    var name

    if (!hasOwn.call(visibleKeys, key)) {
        name = "[" + key + "]"
    }

    if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
            if (recurseTimes === null) {
                str = formatValue(ctx, desc.value, null)
            } else {
                str = formatValue(ctx, desc.value, recurseTimes - 1)
            }
            if (str.indexOf("\n") > -1) {
                if (array) {
                    str = str.replace(/\n(?!$)/g, "\n  ").slice(2)
                } else {
                    str = "\n" + str.replace(/\n(?!$)/g, "\n   ")
                }
            }
        } else {
            str = ctx.stylize("[Circular]", "special")
        }
    }

    if (name === undefined) {
        if (array && key.match(/^\d+$/)) {
            return str
        }
        name = quote("" + key)
        if (name.match(/^'([a-zA-Z_][a-zA-Z_0-9]*)'$/)) {
            name = name.substr(1, name.length - 2)
            name = ctx.stylize(name, "name")
        } else {
            name = ctx.stylize(name, "string")
        }
    }

    return name + ": " + str
}

/* eslint-disable no-undef */

var symbolToString = typeof Symbol === "function"
    ? Symbol().toString
    : undefined

/* eslint-enable no-undef */

function formatPrimitive(ctx, value) {
    if (value === undefined) {
        return ctx.stylize("undefined", "undefined")
    }

    if (typeof value === "string") {
        return ctx.stylize(quote(value), "string")
    }

    if (typeof value === "symbol") {
        return ctx.stylize(symbolToString.call(value), "symbol")
    }

    if (typeof value === "number") {
        return ctx.stylize("" + value, "number")
    }

    if (typeof value === "boolean") {
        return ctx.stylize("" + value, "boolean")
    }

    // For some reason typeof null is "object", so special case here.
    if (value === null) {
        return ctx.stylize("null", "null")
    }

    return undefined
}

function reduceToSingleString(output, base, braces) {
    var numLinesEst = 0
    var length = output.reduce(function (prev, cur) {
        numLinesEst++
        if (/\n/.test(cur)) numLinesEst++
        return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1
    }, 0)

    if (length > 60) {
        return braces[0] +
           (base === "" ? "" : base + "\n ") +
           " " +
           output.join(",\n  ") +
           " " +
           braces[1]
    }

    return braces[0] + base + " " + output.join(", ") + " " + braces[1]
}

function _extend(origin, add) {
    // Don't do anything if add isn't an object
    if (typeof add !== "object" || add === null) return origin

    var keys = Object.keys(add)
    var i = keys.length

    while (i--) {
        origin[keys[i]] = add[keys[i]]
    }
    return origin
}
