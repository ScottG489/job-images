#!/bin/bash
set -e

source /opt/build/build_functions.sh

set +x
setup_credentials "$1"
set -x

# Start the docker daemon. This is necessary when using the sysbox-runc container runtime rather than mounting docker.sock
dockerd > /var/log/dockerd.log 2>&1 &
sleep 3

# These are prefixed with an _ because they have global scope and the build_function lib may have overlap
declare -r _PROJECT_NAME='job-images'
declare -r _JOB_NAME='google-takeout-gdrive-to-s3'
declare -r _GIT_REPO='git@github.com:ScottG489/job-images.git'
# Used for the domain name but also the s3 bucket (AWS requires them to be the same)

git clone $_GIT_REPO
cd $_PROJECT_NAME/$_JOB_NAME

build_push_application $_JOB_NAME
