#!/usr/bin/env sh

if [[ -t 0 ]]; then
    if [[ $# -eq 0 ]]; then
        exec /usr/bin/env sh
    else
        exec $@
    fi
else
    exec precedence-api "$@"
fi
