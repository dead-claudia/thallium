#!/usr/bin/env bash
# Include a local nvm installation
. "$NVM_DIR/nvm.sh"

# If you're running a *nix system with Bash + nvm, this makes testing versions
# much easier. Note that this isn't put through the CI, but merely here as a
# convenience.

# PRs are welcome if you'd like to contribute a Windows batch equivalent for
# nodist/nvm-windows/nvmw/etc., or if you want to add support for FreeBSD, which
# won't likely gain support anytime soon.

nvm exec node ./node_modules/.bin/eslint $(dirname $0) || exit $?

for i in 0.8 0.10 0.12 1 2 3 4 5; do
    nvm which $i > /dev/null 2>&1 || nvm install $i || exit $?
    nvm exec $i mocha $@ || exit $?
done
