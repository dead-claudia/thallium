"use strict"

/* eslint-env node, shelljs */

require("shelljs/make")
var path = require("path")
var chokidar = require("chokidar")
var semver = require("semver")
var pkg = require("./package.json")

function c(cmd) {
    return path.resolve(__dirname, "./node_modules/.bin", cmd)
}

function exec(str, cb) {
    return global.exec(str, {stdio: "inherit"}, cb)
}

config.fatal = true

target.all = function () {
    target.lint()
    target.test()
}

target.lint = function () {
    exec(c("eslint") + " . --cache --color")
    exec(c("coffeelint") + " . --cache --color=always")
}

target.test = function () {
    target["test:chrome"]()
    target["test:phantomjs"]()
    target["test:node"]()
}

target["test:chrome"] = function () {
    exec(c("karma") + " start --colors --single-run --browsers Chrome")
}

target["test:phantomjs"] = function () {
    exec(c("karma") + " start --colors --single-run --browsers PhantomJS")
}

target["test:node"] = function () {
    exec(c("mocha") + " --colors")
}

var patterns = [
    "{bin,fixtures,helpers,lib,r,scripts,test,migrate}/**/{.,}*.js",
    "{bin,fixtures,helpers,lib,r,scripts,test,migrate}/**/{.,}*.coffee",
    "{.,}*.js",
    "{.,}*.coffee",
]

// This creates a closure with `onchange` to not use the memoized versions
// ShellJS replaces them with after the initial tick.
function watch(task) {
    config.fatal = false
    var active = false
    var queue = []
    var timeout

    function execute() {
        for (var i = 0; i < queue.length; i++) {
            console.error(queue[i].event, queue[i].path)
        }

        queue = []
        active = true

        exec("node make " + task, function () {
            active = false
            if (queue.length) execute()
        })
    }

    chokidar.watch(patterns, {
        cwd: __dirname,
        ignored: ["**/test-bundle.js"],
    })
    .on("all", function (event, path) {
        // Give time for the file changes to settle by delaying and debouncing
        // the `onchange` task.
        if (timeout != null) clearTimeout(timeout)
        queue.push({event: event, path: path})
        timeout = setTimeout(function () {
            timeout = undefined
            if (!active) execute()
        }, 500)
    })
    .on("error", function (error) {
        console.error(error.stack)
    })
    .once("ready", function () {
        console.error('Watching "' + patterns.join('", "') + '"...')
    })
}

target.watch = function () {
    watch("test")
}

target["watch:chrome"] = function () {
    watch("test:chrome")
}

target["watch:phantomjs"] = function () {
    watch("test:phantomjs")
}

target["watch:node"] = function () {
    watch("test:node")
}

target.bundle = function () {
    exec(c("browserify") +
        " -dr ./lib/browser-bundle.js:thallium -o thallium.js")
}

target.release = function (args) { // eslint-disable-line max-statements
    var force = false
    var increment

    for (var i = 0; i < args.length; i++) {
        switch (args[i]) {
        case "major": case "minor": case "patch":
        case "premajor": case "preminor": case "prepatch": case "prerelease":
            if (increment != null) {
                console.error(
                    "Unexpected additional increment parameter: " + args[i])
                exit(1)
            }
            increment = args[i]
            break

        case "--force": case "-f": force = true; break
        case "--no-force": force = false; break
        default: // ignore
        }
    }

    if (increment == null) {
        console.error([
            "Increment parameter required. Use this target like so:",
            "",
            "node make release -- <semver-compatible increment> [ -f ]",
        ].join("\n"))
        exit(1)
    }

    if (!force) {
        var changelogUpdated = false
        var treeDirty = false

        exec("/usr/bin/env bash scripts/test.sh")
        exec("git status --porcelain", {silent: true}).stdout
        .split(/\r?\n/g)
        .filter(function (line) { return line !== "" })
        .forEach(function (line) {
            if (/^( M|M |MM) CHANGELOG\.md$/.test(line)) {
                changelogUpdated = true
            } else {
                treeDirty = true
            }
        })

        if (!changelogUpdated || treeDirty) {
            if (!changelogUpdated) {
                console.error("Error: Changelog must be updated!")
            }

            if (treeDirty) {
                console.error("Error: Tree must not be dirty!")
            }

            exit(1)
        }
    }

    target.bundle()

    // Add everything
    exec("git add thallium.js package.json CHANGELOG.md")

    // Increment the package version and get the printed version
    pkg.version = semver.inc(pkg.version, increment)
    JSON.stringify(pkg).to(require.resolve("../package.json"))

    exec("git commit --message=v" + pkg.version)
    exec("git tag v" + pkg.version)
    exec("git push")
    exec("git push --tags")
}
