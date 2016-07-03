'use strict'

# It's in CoffeeScript, since I'm lazy.
module.exports = (config) ->
    config.set
        basePath: __dirname
        restartOnFileChange: yes

        # browsers: ['Chrome', 'Firefox']
        frameworks: ['browserify', 'mocha']
        reporters: ['dots']

        customLaunchers:
            ChromeTravisCI:
                base: 'Chrome'
                flags: ['--no-sandbox']

        files: [
            './scripts/globals.js'
            {pattern: './test/**/*.js', nocache: yes}
            {pattern: './lib/**/*.js', included: no, served: no}
            {pattern: './scripts/**/*.js', included: no, served: no}
            {pattern: './r/**/*.js', included: no, served: no}
        ]

        exclude: ['./test/cli/**']

        preprocessors:
            './scripts/globals.js': ['browserify']

        browserify:
            debug: yes
            insertGlobals: yes
            fullPaths: yes

        singleRun: !!process.env.TRAVIS

        browserNoActivityTimeout:
            # This should be way more than enough.
            if process.env.NO_TIMEOUT then 1000000000 else 10000
