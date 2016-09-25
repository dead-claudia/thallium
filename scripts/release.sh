#!/usr/bin/env bash
# Helper script to release an update

if [[ ! "$1" ]]; then
    echo <<message_end
A version type is required. Please pass a semver-compatible increment, like
'patch', 'minor', or 'major'.
message_end
    exit 1
fi

set -e
cd $(dirname $0)

# Run the tests
bash scripts/test.sh

# Create the bundle
npm run bundle

# Open the changelog
atom --wait ../CHANGELOG.md

# Increment the version in JS-land
version=$(node -e "
var pkg = require('../package.json')
pkg.version = require('semver').inc(pkg.version, '$1')
require('fs').writeFileSync(
    require.resolve('../package.json'),
    "utf-8",
    JSON.stringify(pkg))
console.log(pkg.version)
")

# Commit everything
git add ../thallium.js ../package.json ../CHANGELOG.md
git commit --message=${version}
git push
git push --tags

# Publish
npm login
npm publish
npm logout
