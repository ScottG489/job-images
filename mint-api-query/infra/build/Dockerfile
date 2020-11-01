FROM ubuntu:20.04

RUN apt-get update && \
    DEBIAN_FRONTEND="noninteractive" \
    TZ="America/New_York" \
    apt install -y \
    git \
    docker.io \
    jq

RUN mkdir /root/.ssh
COPY known_hosts /root/.ssh/known_hosts

RUN mkdir /root/.docker

RUN mkdir -p /opt/build
COPY run.sh /opt/build/run.sh
COPY build_functions.sh /opt/build/build_functions.sh

WORKDIR /opt/build
ENTRYPOINT ["./run.sh"]
