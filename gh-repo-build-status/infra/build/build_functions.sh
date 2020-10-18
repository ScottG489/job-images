#!/bin/bash
set -e

get_git_root_dir() {
  echo -n "$(git rev-parse --show-toplevel)/gh-repo-build-status"
}

setup_credentials() {
  set +x
  local ID_RSA_CONTENTS
  local DOCKER_CONFIG_CONTENTS

  readonly ID_RSA_CONTENTS=$(echo -n $1 | jq -r .ID_RSA | base64 --decode)
  readonly DOCKER_CONFIG_CONTENTS=$(echo -n $1 | jq -r .DOCKER_CONFIG | base64 --decode)

  printf -- "$ID_RSA_CONTENTS" >/root/.ssh/id_rsa
  printf -- "$DOCKER_CONFIG_CONTENTS" >/root/.docker/config.json

  chmod 400 /root/.ssh/id_rsa
}

build_push_application() {
  local ROOT_DIR
  local JOB_IMAGE_NAME
  readonly ROOT_DIR=$(get_git_root_dir)
  readonly JOB_IMAGE_NAME=$1
  cd "$ROOT_DIR"

  npm ci

  docker build -t scottg489/"$JOB_IMAGE_NAME"-job:latest .
  docker push scottg489/"$JOB_IMAGE_NAME"-job:latest
}
