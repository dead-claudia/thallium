#!/usr/bin/env bash
# Include a local nvm installation
. "$NVM_DIR/nvm.sh"

# If you're running a *nix system with Bash + nvm, this makes testing versions
# much easier. Note that this isn't put through the CI, but merely here as a
# convenience.

# PRs are welcome if you'd like to contribute a Windows batch equivalent for
# nodist/nvm-windows/nvmw/etc., or if you want to add support for another OS.

eslint $(dirname $0) --cache || exit $?
coffeelint $(dirname $0) --cache || exit $?

for i in 0.10 0.12 1 2 3 4 5 6; do
    nvm which $i > /dev/null 2>&1 || nvm install $i || exit $?
    nvm exec $i mocha $@ || exit $?
done

export CHROME_BIN=$(which google-chrome)
karma start --browsers Chrome,Firefox --single-run || exit $?
