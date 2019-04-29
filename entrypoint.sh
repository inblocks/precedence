#!/usr/bin/env sh

if [[ -t 0 ]]; then
    exec /usr/bin/env sh
else
    exec precedence-api "$@"
fi
