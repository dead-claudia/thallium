#!/usr/bin/env sh
pwd
for i in "$@"; do
    echo "$i"
done
${PROGRAM} ${BINARY}
