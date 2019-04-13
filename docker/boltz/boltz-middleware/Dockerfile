FROM node:lts-alpine as builder
# Install general dependencies
RUN apk update && apk add \
		g++ \
		gcc \
		libc6-compat \
		make \
		pkgconfig \
		rsync \
		python \
		--no-cache git \
	&& rm -rf /var/lib/apt/lists/*

# Clone boltz-middleware
WORKDIR /opt
RUN git clone https://github.com/BoltzExchange/boltz-middleware
WORKDIR /opt/boltz-middleware
RUN npm install --quiet
RUN npm run compile

FROM node:lts-alpine
RUN apk update && apk add rsync
# Copy boltz-middleware from builder image
WORKDIR /opt/boltz-middleware
COPY --from=builder /opt/boltz-middleware .

WORKDIR /root/.boltz
COPY --from=boltz/backend:latest /root/.boltz /root/.boltz

# Expose RPC port
EXPOSE 9001

# Start boltz service
WORKDIR /opt/boltz-middleware
ENTRYPOINT ["npm","start"]
