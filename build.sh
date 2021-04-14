#!/bin/bash
set -e

declare -r ID_RSA_CONTENTS_BASE64=$1
declare -r DOCKER_CONFIG_CONTENTS_BASE64=$2

./gh-repo-build-status/infra/build/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'gh-repo-build-status/infra/build' \
  'scottg489/gh-repo-build-status-job-build:latest'

./gh-repo-build-status/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64"


./google-takeout-export/infra/build/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'google-takeout-export/infra/build' \
  'scottg489/google-takeout-export-job-build:latest'

./google-takeout-export/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64"


./google-takeout-gdrive-to-s3/infra/build/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'google-takeout-gdrive-to-s3/infra/build' \
  'scottg489/google-takeout-gdrive-to-s3-job-build:latest'

./google-takeout-gdrive-to-s3/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64"


./mint-api-query/infra/build/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'mint-api-query/infra/build' \
  'scottg489/mint-api-query-job-build:latest'

./mint-api-query/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64"


./echo/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'echo' \
  'scottg489/echo-job:latest'


./sleep/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'sleep' \
  'scottg489/sleep-job:latest'


./test-support/build.sh \
  "$ID_RSA_CONTENTS_BASE64" \
  "$DOCKER_CONFIG_CONTENTS_BASE64" \
  'git@github.com:ScottG489/job-images.git' \
  'test-support' \
  'scottg489/test-support-job:latest'
