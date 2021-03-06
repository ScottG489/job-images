#!/bin/bash
set -e

set +x
readonly AWS_CREDENTIALS_CONTENTS=$(jq -r .AWS_CREDENTIALS_FILE_BASE64 /run/build/secrets/secrets | base64 --decode)
printf -- "$AWS_CREDENTIALS_CONTENTS" >/root/.aws/credentials
set -x

# TODO: Use --transpile-only because it has a very slow startup time otherwise. Possibly related:
# TODO:   https://github.com/TypeStrong/ts-node/issues/754
ts-node --transpile-only src/index.ts

tar xvf /tmp/takeout/takeout-*.tgz --directory /tmp/takeout
rm --verbose /tmp/takeout/takeout-*.tgz

aws s3 sync /tmp/takeout/Takeout s3://gdrive-takeout/Takeout

ts-node --transpile-only src/index.ts delete
