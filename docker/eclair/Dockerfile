ARG UBUNTU_VERSION

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install git openjdk-11-jdk openjdk-11-jdk-headless maven

RUN git clone https://github.com/ACINQ/eclair.git

WORKDIR /eclair

RUN git checkout v${VERSION}

RUN mvn package -pl eclair-node -am -Dmaven.test.skip=true

RUN ls /eclair/eclair-node/target

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

# Copy the executables first to avoid caching of the apt repositories

# Copy eclair-cli executable
COPY --from=builder /eclair/eclair-core/eclair-cli /usr/local/bin/

# Copy the actual node
COPY --from=builder /eclair/eclair-node/target/eclair-node-*.zip /eclair-node.zip

RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y jq curl unzip openjdk-11-jdk openjdk-11-jdk-headless

RUN unzip eclair-node.zip && rm eclair-node.zip && mv eclair-node-* eclair-node

ENTRYPOINT /eclair-node/bin/eclair-node.sh
