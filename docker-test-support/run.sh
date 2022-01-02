#!/bin/sh
set -e

dockerd > /var/log/dockerd.log 2>&1 &
# Wait for dockerd to start
n=0
while [ "$n" -lt 100 ] ; do
  docker ps > /dev/null 2>&1 && break
  n=$(( n + 1 ))
  [ "$n" -lt 100 ] || exit 1
  sleep .1
done

docker image ls -aq --no-trunc | head -1
docker ps -aq --no-trunc | head -1

docker build -q -t test .
docker run -d test