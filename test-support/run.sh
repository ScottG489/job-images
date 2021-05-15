#!/bin/sh
set -e

SLEEP=$(echo -n $1 | cut -d '|' -f 1)
OUTPUT=$(echo -n $1 | cut -d '|' -f 2)
FILE_NAME=$(echo -n $1 | cut -d '|' -f 3)
EXIT_CODE=$(echo -n $1 | cut -d '|' -f 4)

sleep "$SLEEP"

echo -n "$OUTPUT"

[ -n "$FILE_NAME" ] && cat "$FILE_NAME"

exit "$EXIT_CODE"
