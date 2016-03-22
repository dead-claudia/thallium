"use strict"

require("shelljs/make")
var dirname = require("path").dirname

config.fatal = true

cd(__dirname)

target.test = target.all = function () {
    exec("mocha --colors", {cwd: __dirname})
}

target.clean = function () {
    rm("-rf", "lib")
}

target.compile = function () {
    target.test()
    target.clean()

    find("src")
    .filter(function (file) { return test("-f", file) })
    .map(function (file) { return file.slice(4) })
    .forEach(function (file) {
        mkdir("-p", dirname("lib/" + file))
        if (file.slice(-3) === ".ls") {
            exec("lsc --no-header -cbpm embedded src/" + file, {silent: true})
            .stdout.to("lib/" + file.slice(0, -3) + ".js")
        } else {
            cp("src/" + file, "lib/" + file)
        }
    })
}
