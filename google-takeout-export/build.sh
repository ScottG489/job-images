curl -v -sS -w '%{http_code}' \
  --data-binary '{"ID_RSA": "'"$1"'", "DOCKER_CONFIG": "'"$2"'"}' \
  'http://api.simple-ci.com/build?image=scottg489/google-takeout-export-job-build:latest' \
  | tee /tmp/foo \
  | sed '$d' && \
  [ "$(tail -1 /tmp/foo)" -eq 200 ]
