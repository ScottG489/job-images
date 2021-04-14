#!/bin/sh
set -e

SLEEP=$(echo -n $1 | cut -d '|' -f 1)
OUTPUT=$(echo -n $1 | cut -d '|' -f 2)
EXIT_CODE=$(echo -n $1 | cut -d '|' -f 3)

sleep $SLEEP

echo -n $OUTPUT

exit $EXIT_CODE
