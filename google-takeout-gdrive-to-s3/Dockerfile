FROM ubuntu:20.04

RUN apt-get update && \
    DEBIAN_FRONTEND="noninteractive" \
    TZ="America/New_York" \
    apt install -y \
    npm \
    nodejs \
    awscli \
    jq

RUN npm install ts-node --global

RUN mkdir /root/.aws

RUN mkdir /tmp/takeout

COPY node_modules /node_modules
COPY tsconfig.json /tsconfig.json
COPY src /src
COPY run-app.sh /run-app.sh

CMD ["./run-app.sh"]
