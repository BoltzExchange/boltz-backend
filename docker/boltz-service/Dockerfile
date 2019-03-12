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

RUN npm install gulp nodemon typescript --quiet

# Clone boltz-backend
WORKDIR /opt
RUN git clone https://github.com/BoltzExchange/boltz-backend
WORKDIR /opt/boltz-backend
RUN npm install --quiet

FROM node:lts-alpine
RUN apk update && apk add rsync
# Copy boltz-backend from builder image
WORKDIR /opt/boltz-backend
COPY --from=builder /opt/boltz-backend .

# Expose RPC port
EXPOSE 9000

# Compile TypeScript
RUN npm run compile

# Copty config file
WORKDIR /root/.boltz
COPY boltz.conf boltz.conf 

WORKDIR /opt/boltz-backend

# Start boltz service
ENTRYPOINT ["npm","start"]

