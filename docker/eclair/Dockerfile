ARG UBUNTU_VERSION

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install git openjdk-21-jdk-headless maven unzip

RUN git clone https://github.com/ACINQ/eclair.git

WORKDIR /eclair

RUN git checkout v${VERSION}

RUN mvn package -pl eclair-node -am -Dmaven.test.skip=true

RUN cd eclair-node/target && unzip eclair-node-*.zip
RUN rm eclair-node/target/eclair-node-*.zip

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

# Copy the executables first to avoid caching of the apt repositories

# Copy eclair-cli executable
COPY --from=builder /eclair/eclair-core/eclair-cli /usr/local/bin/

# Copy the actual node
COPY --from=builder /eclair/eclair-node/target/eclair-node-* /eclair-node

RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y jq curl openjdk-21-jre-headless

ENTRYPOINT /eclair-node/bin/eclair-node.sh
