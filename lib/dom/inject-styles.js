"use strict"

var Util = require("../util")
var D = require("./inject")
var assert = Util.assert

/**
 * The reporter stylesheet. Here's the format:
 *
 * // Single item
 * ".selector": {
 *     // props...
 * }
 *
 * // Duplicate entries
 * ".selector": {
 *     "prop": [
 *         // values...
 *     ],
 * }
 *
 * // Duplicate selectors
 * ".selector": [
 *     // values...
 * ]
 *
 * // Media query
 * "@media screen": {
 *     // selectors...
 * }
 *
 * Note that CSS strings *must* be quoted inside the value.
 */

var styles = Util.lazy(function () {
    var hasOwn = Object.prototype.hasOwnProperty

    /**
     * Partially taken and adapted from normalize.css (licensed under the MIT
     * License).
     * https://github.com/necolas/normalize.css
     */
    var styleObject = {
        "#tl": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "-ms-text-size-adjust": "100%",
            "-webkit-text-size-adjust": "100%",
        },

        "#tl button": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "overflow": "visible",
            "font-size": "100%",
            "margin": "0",
            "text-transform": "none",
            "-webkit-appearance": "button",
        },

        "#tl h1": {
            "font-size": "2em",
            "margin": "0.67em 0",
        },

        "#tl a": {
            "background-color": "transparent",
            "-webkit-text-decoration-skip": "objects",
        },

        "#tl a:active, #tl a:hover": {
            "outline-width": "0",
        },

        "#tl button::-moz-focus-inner": {
            "border-style": "none",
            "padding": "0",
        },

        "#tl button:-moz-focusring": {
            outline: "1px dotted ButtonText",
        },

        /**
         * Base styles. Note that this CSS is designed to intentionally override
         * most things that could propagate.
         */
        "#tl *": [
            {"text-align": "left"},
            {"text-align": "start"},
        ],

        "#tl .tl-report, #tl .tl-report ul": {
            "list-style-type": "none",
        },

        "#tl li ~ .tl-suite": {
            "padding-top": "1em",
        },

        "#tl .tl-suite > h2": {
            "color": "black",
            "font-size": "1.5em",
            "font-weight": "bold",
            "margin-bottom": "0.5em",
        },

        "#tl .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.3em",
        },

        "#tl .tl-suite .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.2em",
            "font-weight": "normal",
        },

        "#tl .tl-test > h2": {
            "color": "black",
            "font-size": "1em",
            "font-weight": "normal",
            "margin": "0",
        },

        "#tl .tl-test > :first-child::before": {
            "display": "inline-block",
            "font-weight": "bold",
            "width": "1.2em",
            "text-align": "center",
            "font-family": "sans-serif",
            "text-shadow": "0 3px 2px #969696",
        },

        "#tl .tl-test.tl-fail > h2, #tl .tl-test.tl-error > h2": {
            color: "#c00",
        },

        "#tl .tl-test.tl-skip > h2": {
            color: "#08c",
        },

        "#tl .tl-test.tl-pass > :first-child::before": {
            content: "'✓'",
            color: "#0c0",
        },

        "#tl .tl-test.tl-fail > :first-child::before": {
            content: "'✖'",
        },

        "#tl .tl-test.tl-error > :first-child::before": {
            content: "'!'",
        },

        "#tl .tl-test.tl-skip > :first-child::before": {
            content: "'−'",
        },

        "#tl .tl-pre, #tl .tl-diff-header": {
            // normalize.css: Correct the inheritance and scaling of font size
            // in all browsers
            "font-family": "monospace, monospace",
            "background": "#f0f0f0",
            "white-space": "pre",
            "font-size": "0.85em",
        },

        "#tl .tl-pre": {
            "min-width": "100%",
            "float": "left",
            "clear": "left",
        },

        "#tl .tl-line": {
            display: "block",
            margin: "0 0.25em",
            width: "99%", // Because Firefox sucks
        },

        "#tl .tl-diff-header > *": {
            padding: "0.25em",
        },

        "#tl .tl-diff-header": {
            "padding": "0.25em",
            "margin-bottom": "0.5em",
            "display": "inline-block",
        },

        "#tl .tl-line:first-child, #tl .tl-diff-header ~ .tl-line": {
            "padding-top": "0.25em",
        },

        "#tl .tl-line:last-child": {
            "padding-bottom": "0.25em",
        },

        "#tl .tl-fail .tl-display": {
            margin: "0.5em",
        },

        "#tl .tl-display > *": {
            overflow: "auto",
        },

        "#tl .tl-display > :not(:last-child)": {
            "margin-bottom": "0.5em",
        },

        "#tl .tl-diff-added": {
            "color": "#0c0",
            "font-weight": "bold",
        },

        "#tl .tl-diff-removed": {
            "color": "#c00",
            "font-weight": "bold",
        },

        "#tl .tl-stack .tl-line": {
            color: "#800",
        },

        "#tl .tl-diff::before, #tl .tl-stack::before": {
            "font-weight": "normal",
            "margin": "0.25em 0.25em 0.25em 0",
            "display": "block",
            "font-style": "italic",
        },

        "#tl .tl-diff::before": {
            content: "'Diff:'",
        },

        "#tl .tl-stack::before": {
            content: "'Stack:'",
        },

        "#tl .tl-header": {
            "text-align": "right",
        },

        "#tl .tl-header > *": {
            "display": "inline-block",
            "text-align": "center",
            "padding": "0.5em 0.75em",
            "border": "2px solid #00c",
            "border-radius": "1em",
            "background-color": "transparent",
            "margin": "0.25em 0.5em",
        },

        "#tl .tl-header > :focus": {
            outline: "none",
        },

        "#tl .tl-run": {
            "border-color": "#080",
            "background-color": "#0c0",
            "color": "white",
            "width": "6em",
        },

        "#tl .tl-run:hover": {
            "background-color": "#8c8",
            "color": "white",
        },

        "#tl .tl-toggle.tl-pass": {
            "border-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail": {
            "border-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip": {
            "border-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass.tl-active, #tl .tl-toggle.tl-pass:active": {
            "border-color": "#080",
            "background-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail.tl-active, #tl .tl-toggle.tl-fail:active": {
            "border-color": "#800",
            "background-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip.tl-active, #tl .tl-toggle.tl-skip:active": {
            "border-color": "#058",
            "background-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass:hover": {
            "border-color": "#0c0",
            "background-color": "#afa",
        },

        "#tl .tl-toggle.tl-fail:hover": {
            "border-color": "#c00",
            "background-color": "#faa",
        },

        "#tl .tl-toggle.tl-skip:hover": {
            "border-color": "#08c",
            "background-color": "#bdf",
        },

        "#tl .tl-report.tl-pass .tl-test:not(.tl-pass)": {
            display: "none",
        },

        "#tl .tl-report.tl-fail .tl-test:not(.tl-fail)": {
            display: "none",
        },

        "#tl .tl-report.tl-skip .tl-test:not(.tl-skip)": {
            display: "none",
        },
    }

    var css = ""

    function appendBase(selector, props) {
        assert(typeof selector === "string")
        css += selector + "{"

        if (Array.isArray(props)) {
            for (var i = 0; i < props.length; i++) {
                appendProps(props[i])
            }
        } else {
            appendProps(props)
        }

        css += "}"
    }

    function appendProps(props) {
        assert(props != null && typeof props === "object")
        for (var key in props) {
            if (hasOwn.call(props, key)) {
                if (typeof props[key] === "object") {
                    appendBase(key, props[key])
                } else {
                    css += key + ":" + props[key] + ";"
                }
            }
        }
    }

    for (var selector in styleObject) {
        if (hasOwn.call(styleObject, selector)) {
            appendBase(selector, styleObject[selector])
        }
    }

    return css.concat() // Hint to flatten.
})

module.exports = function () {
    if (D.document.head.querySelector("style[data-tl-style]") == null) {
        var style = D.document.createElement("style")

        style.type = "text/css"
        style.setAttribute("data-tl-style", "")
        if (style.styleSheet) {
            style.styleSheet.cssText = styles()
        } else {
            style.appendChild(D.document.createTextNode(styles()))
        }

        D.document.head.appendChild(style)
    }
}
