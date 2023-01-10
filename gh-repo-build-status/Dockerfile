FROM ubuntu:20.04

RUN apt-get update && \
    DEBIAN_FRONTEND="noninteractive" \
    TZ="America/New_York" \
    apt install -y \
    npm \
    nodejs

RUN npm install ts-node --global

COPY node_modules /node_modules
COPY src /src

ENTRYPOINT ["ts-node", "src/index.ts"]
