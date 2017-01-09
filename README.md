# Thallium

[![Travis Build Status](https://travis-ci.org/isiahmeadows/thallium.svg?branch=master)](https://travis-ci.org/isiahmeadows/thallium) [![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/f9lhn8ivfwj39k7k?svg=true)](https://ci.appveyor.com/project/isiahmeadows/thallium)
[![Join the chat at https://gitter.im/isiahmeadows/thallium](https://badges.gitter.im/isiahmeadows/thallium.svg)](https://gitter.im/isiahmeadows/thallium?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A simple, unopinionated, modular test framework meant to simplify your tests. It supports Node 4 and later, as well as PhantomJS 2 and browsers (tested in Chrome and Firefox).

*Note that this is a huge work in progress, and is probably not suited for production projects.*

## Installation

First, install [Node and npm](https://nodejs.org/en/download/).

```sh
npm install --save-dev thallium

# If you would like it globally installed, that works, too.
npm install --global thallium
```

Also, if you target older runtimes like PhantomJS or Internet Explorer, this will require a Promise polyfill, such as [es6-promise](https://github.com/stefanpenner/es6-promise). That polyfill in particular is used by this library to test in PhantomJS 2.

## Usage and API

Check out the [documentation](http://github.com/isiahmeadows/thallium/blob/master/docs/README.md).

```sh
# Your basic command
tl
```

Couple specific notes:

1. I plan to make this a very batteries-included framework. It includes several useful utilities like an assertion library far more helpful than Node's `assert` (you can easily define your own ad-hoc assertions, even - I do it in the tests themselves).

2. Not much configuration is required to get started. I aim for ease of use and convention over configuration, but I also try to enable as much flexibility as you need. Your config file can even return a promise, if that's what you need.

## Versioning

As soon as it's 1.0, I'll stick to [semver](https://semver.org). Until then, here's how I'll aim for new versions:

- Minor versions (`0.x`) represent larger breaking changes or larger new features. This includes much of the [primary roadmap](https://github.com/isiahmeadows/thallium/blob/master/roadmap.md).
- Patch versions (`0.1.x`, `0.2.x`, etc.) represent bug fixes and smaller breaking changes/new features. This includes some of the nice-to-haves I've listed below the roadmap.

I will try to avoid breaking changes on patch updates, but it's not guaranteed, particularly if it's because a bug fix.

## Recent Updates

See the [changelog](https://github.com/isiahmeadows/thallium/blob/master/CHANGELOG.md) for the most recent published changes. It also contains some useful migration information for dealing with breaking changes.

And in case you want to know what's in the works, [look here](https://github.com/isiahmeadows/thallium/blob/master/roadmap.md).

## Contributing

See [CONTRIBUTING.md](https://github.com/isiahmeadows/thallium/blob/master/CONTRIBUTING.md).

## License

The following license (ISC License), unless otherwise stated:

Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com> and others.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
