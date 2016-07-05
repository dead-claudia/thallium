"use strict"

var Console = require("./console.js")
var Dispatch = require("./dispatch.js")
var ReporterUtil = require("./util.js")
var Stack = require("./stack.js")

exports.Symbols = Console.Symbols
exports.windowWidth = Console.windowWidth
exports.newline = Console.newline
exports.setColor = Dispatch.setColor
exports.unsetColor = Dispatch.unsetColor
exports.consoleReporter = Dispatch.consoleReporter
exports.on = Dispatch.on
exports.joinPath = ReporterUtil.joinPath
exports.speed = ReporterUtil.speed
exports.isReport = ReporterUtil.isReport
exports.formatTime = ReporterUtil.formatTime
// exports.unifiedDiff = ReporterUtil.unifiedDiff
exports.stripMessage = Stack.stripMessage
exports.getStack = Stack.getStack
exports.color = require("./color.js")
exports.Reporter = require("./reporter.js")
exports.Colors = require("./colors.js")
