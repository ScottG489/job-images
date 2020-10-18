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
