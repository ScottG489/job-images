FROM ubuntu:20.04

RUN apt-get update && \
    DEBIAN_FRONTEND="noninteractive" \
    TZ="America/New_York" \
    apt install -y \
    nodejs

COPY node_modules /node_modules
COPY index.ts /index.ts

CMD ["node", "index.ts"]
