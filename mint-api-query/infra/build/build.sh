curl -v -sS -w '%{http_code}' \
  --data-binary '{"ID_RSA": "'"$1"'", "DOCKER_CONFIG": "'"$2"'", "GIT_REPO_URL": "'"$3"'", "RELATIVE_SUB_DIR": "'"$4"'", "DOCKER_IMAGE_NAME": "'"$5"'"}' \
  'http://api.simple-ci.com/build?image=scottg489/docker-build-push:latest' \
  | tee /tmp/foo \
  | sed '$d' && \
  [ "$(tail -1 /tmp/foo)" -eq 200 ]
