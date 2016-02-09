# Techtonic

[![Build Status](https://travis-ci.org/isiahmeadows/techtonic.svg?branch=master)](https://travis-ci.org/isiahmeadows/techtonic) [![Join the chat at https://gitter.im/isiahmeadows/techtonic](https://badges.gitter.im/isiahmeadows/techtonic.svg)](https://gitter.im/isiahmeadows/techtonic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 0.10 and later, and browser support is also planned.

*Note that this is a huge work in progress.*

## Installation

```
npm install --save-dev isiahmeadows/techtonic
```

## Usage

To be completed. This is waiting on the completion of the CLI, but for now, you can look at the tests.

## API

To be completed. See the source, tests, and TypeScript definition file for now.

## Remaining work

1. Unbreak Node 0.8-0.12, since those will be supported in the end. They seem to be having odd timing issues, where methods are called with odd arguments. I've replaced the buggy [es6-promise](http://npm.im/es6-promise) with [Bluebird](http://www.bluebirdjs.com) (which only deviates in areas irrelevant in practice how I use it), since it's faster, and will be less likely to interfere with timers. It's all the more reason to fix the third item in this list. :(
2. Finish + test the CLI. It's still a work in progress, mostly in testing.
3. Remove Promise dependency, but still keep the stack down between tests.
4. Self-host this module's tests like what Mocha does.
5. Update TypeScript definitions
6. Write the documentation for this project, including the many core assertions.

## License

ISC, unless otherwise stated (two exceptions are lib/inspect.js and lib/util.js).
