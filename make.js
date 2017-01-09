"use strict"

/* eslint-env node, shelljs */

require("shelljs/make")
var path = require("path")
var chokidar = require("chokidar")
var semver = require("semver")
var pkg = require("./package")

function c(cmd) {
    return path.resolve(__dirname, "node_modules/.bin", cmd)
}

function exec(str, cb) {
    if (Array.isArray(str)) str = str.join(" ")
    echo("exec: " + str)
    return global.exec(str, {stdio: "inherit"}, cb)
}

function task(name, callback) {
    target[name] = function (arg) {
        if (callback.length) {
            echo("=== Task `" + name + "`, args: " + arg.join(" ") + " ===")
        } else {
            echo("=== Task `" + name + "` ===")
        }
        return callback(arg)
    }
}

config.fatal = true

task("all", function () {
    target.lint()
    target.test()
})

task("lint", function () {
    exec(c("eslint") + " . --cache --color")
    exec(c("coffeelint") + " . --cache --color=always")
})

task("test", function () {
    target["test:chrome"]()
    target["test:firefox"]()
    target["test:phantomjs"]()
    target["test:node"]()
})

task("test:chrome", function () {
    exec(c("karma") + " start --colors --single-run --browsers Chrome")
})

task("test:firefox", function () {
    exec(c("karma") + " start --colors --single-run --browsers Firefox")
})

task("test:phantomjs", function () {
    exec(c("karma") + " start --colors --single-run --browsers PhantomJS")
})

task("test:node", function () {
    exec(c("mocha") + " --colors")
})

var dirs = [
    "bin", "fixtures", "helpers", "lib", "r", "test", "test-util", "migrate",
    "assert",
].join(",")

var patterns = ["{" + dirs + "}/**/{.,}*.{js,coffee}", "{.,}*.{js,coffee}"]

// This creates a closure with `onchange` to not use the memoized versions
// ShellJS replaces them with after the initial tick.
function watch(task) {
    config.fatal = false
    var active = false
    var queue = []
    var timeout

    function execute() {
        queue.forEach(function (event) {
            echo(event.name + " " + event.path)
        })

        queue = []
        active = true

        exec("node make " + task, function () {
            active = false
            if (queue.length) execute()
        })
    }

    chokidar.watch(patterns, {
        cwd: __dirname,
        ignored: ["./thallium{,-migrate}.js"],
    })
    .on("all", function (name, path) {
        // Give time for the file changes to settle by delaying and debouncing
        // the `onchange` task.
        if (timeout != null) clearTimeout(timeout)
        queue.push({name: name, path: path})
        timeout = setTimeout(function () {
            timeout = undefined
            if (!active) execute()
        }, 500)
    })
    .on("error", function (err) {
        console.error(err.stack)
    })
    .once("ready", function () {
        console.error('Watching "' + patterns.join('", "') + '"...')
    })
}

task("watch", function () { watch("test") })
task("watch:chrome", function () { watch("test:chrome") })
task("watch:phantomjs", function () { watch("test:phantomjs") })
task("watch:node", function () { watch("test:node") })

task("bundle", function () {
    exec([
        c("browserify"),
        "-dr ./lib/browser-bundle.js:thallium -o thallium.js",
    ])
    exec([
        c("browserify"),
        "-dr ./migrate/bundle.js:thallium -o thallium-migrate.js",
    ])
})

task("update", function (args) {
    var pkgs = args.filter(function (arg) { return arg[0] !== "-" })
    var saveFlag = "--save-dev"

    args
    .filter(function (arg) { return arg[0] === "-" })
    .forEach(function (arg) {
        switch (arg) {
        case "--release": saveFlag = "--save"; break
        case "--raw": saveFlag = ""; break
        default: // ignore
        }
    })

    exec("npm install " + pkgs.join(" ") + saveFlag)

    if (pkgs.indexOf("clean-assert") >= 0) {
        exec("node ./scripts/update-clean-assert.js")
    }
})

task("release", function (args) {
    var force = false
    var increment

    args.forEach(function (arg) {
        switch (arg) {
        case "major": case "minor": case "patch":
        case "premajor": case "preminor": case "prepatch": case "prerelease":
            if (increment != null) {
                console.error("Unexpected additional increment: " + arg)
                exit(1)
            }
            increment = arg
            break

        case "--force": case "-f": force = true; break
        case "--no-force": force = false; break
        default: // ignore
        }
    })

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

    // Increment the package version and get the printed version
    pkg.version = semver.inc(pkg.version, increment)
    JSON.stringify(pkg, null, 2).to(path.resolve(__dirname, "package.json"))

    // Add everything
    exec("git add thallium.js thallium-migrate.js package.json CHANGELOG.md")

    exec("git commit --message=v" + pkg.version)
    exec("git tag v" + pkg.version)
    exec("git push")
    exec("git push --tags")
})
