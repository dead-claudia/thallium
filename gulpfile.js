"use strict"

var gulp = require("gulp")
var rimraf = require("rimraf")
var livescript = require("gulp-livescript")
var mocha = require("gulp-mocha")
var rename = require("gulp-rename")

var ignores = ["!src/cli/**"]

gulp.task("clean", function (callback) {
    rimraf("lib", callback)
})

gulp.task("compile:copy", ["clean", "test"], function () {
    return gulp.src(["src/**/*.*", "!src/**/*.ls"].concat(ignores))
        .pipe(gulp.dest("lib"))
})

gulp.task("compile:ls", ["clean", "test"], function () {
    return gulp.src(["src/**/*.ls"].concat(ignores))
        .pipe(livescript({bare: true, header: false, maps: "embedded"}))
        .pipe(rename({extname: ".js"}))
        .pipe(gulp.dest("lib"))
})

gulp.task("compile", ["compile:copy", "compile:ls"])

gulp.task("test", function () {
    return gulp.src(["test/**/*.ls", "test/**/*.js"], {read: false})
        .pipe(mocha({ui: "tdd", reporter: "dot"}))
})

gulp.task("default", ["compile"])
