"use strict"

// Print an error message, since this is only loaded by legacy clients
// Remove this in 0.5

console.error([
    "Please update your Thallium installation to the latest version.",
    "",
    "If you installed this binary globally:",
    "",
    "    npm update --global thallium",
    "    yarn global upgrade thallium",
    "",
    "If you installed this binary locally only:",
    "",
    "    npm update thallium",
    "    yarn upgrade thallium",
].join("\n"))

module.exports = require("../../cli")
