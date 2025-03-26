ARG NODE_VERSION

FROM node:${NODE_VERSION} AS builder

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
    gcc \
    git \
    g++ \
    curl \
    make \
    wget \
    rsync \
    gnupg2 \
    python3 \
    libc-dev \
    libssl-dev \
    pkg-config \
    lsb-release \
    libzmq3-dev \
    python3-dev \
    protobuf-compiler

RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get -y install libpq-dev

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

ARG VERSION
RUN git clone https://github.com/BoltzExchange/boltz-backend.git -b ${VERSION}
WORKDIR /boltz-backend
RUN git submodule update --init

# Remove dependency that is not needed for the build and unavailable on ARM64
RUN sed -i "/grpc-tools/d" package.json

RUN npm install -g npm
RUN npm install
RUN npm run compile:release

# We do not need dev dependencies in the final image
RUN rm -rf node_modules && npm install --omit dev

FROM node:${NODE_VERSION} AS final

RUN apt-get update && apt-get -y upgrade && \
    apt-get -y install gnupg2 wget lsb-release zstd && \
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get -y install postgresql-client-17 postgresql-client-common && \
    apt-get clean all && rm -rf /var/lib/apt/lists/*

COPY --from=builder /boltz-backend/bin /boltz-backend/bin
COPY --from=builder /boltz-backend/dist /boltz-backend/dist
COPY --from=builder /boltz-backend/node_modules /boltz-backend/node_modules
COPY --from=builder /boltz-backend/boltzr/target/release/boltzr /boltz-backend/boltzr/target/release/boltzr

EXPOSE 9000 9001

ENV NODE_ENV=production
ENV PATH="${PATH}:/boltz-backend/bin"

ENTRYPOINT ["node", "--trace-deprecation", "/boltz-backend/bin/boltzd"]
