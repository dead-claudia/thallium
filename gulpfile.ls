'use strict'

require! {
    gulp
    rimraf
    'gulp-livescript': livescript
    'gulp-mocha': mocha
    'gulp-rename': rename
}

ignores = <[!src/cli/**]>

gulp.task 'clean', (callback) ->
    rimraf 'lib', callback

gulp.task 'compile:copy', <[clean test]>, ->
    gulp.src <[src/**/*.* !src/**/*.ls]> ++ ignores
        .pipe gulp.dest 'lib'

gulp.task 'compile:ls', <[clean test]>, ->
    gulp.src <[src/**/*.ls]> ++ ignores
        .pipe livescript {+bare, -header, maps: 'embedded'}
        .pipe rename extname: '.js'
        .pipe gulp.dest 'lib'

gulp.task 'compile', <[compile:copy compile:ls]>

gulp.task 'test', ->
    gulp.src 'test/**/*.ls', {-read}
        .pipe mocha ui: 'tdd', reporter: 'dot'

gulp.task 'default', <[compile]>
