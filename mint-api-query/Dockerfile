FROM ubuntu:20.04

RUN apt-get update && \
        DEBIAN_FRONTEND="noninteractive" \
        TZ="America/New_York" \
        apt install -y \
        git \
        wget \
        jq \
        python3 \
        python3-pip

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# It's expeceted for the dpkg install to fail due to missing dependencies. Then apt installs everything together
RUN dpkg --install google-chrome-stable_current_amd64.deb || \
        DEBIAN_FRONTEND="noninteractive" \
        TZ="America/New_York" \
        apt-get -fy install
RUN pip3 install mintapi

COPY run-app.sh run.sh

ENTRYPOINT ["./run.sh"]
