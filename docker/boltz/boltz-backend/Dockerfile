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

# Clone boltz-backend
WORKDIR /opt
RUN git clone https://github.com/BoltzExchange/boltz-backend
WORKDIR /opt/boltz-backend
RUN npm install --quiet
RUN npm run compile

FROM node:lts-alpine
RUN apk update && apk add rsync
# Copy boltz-backend from builder image
WORKDIR /opt/boltz-backend
COPY --from=builder /opt/boltz-backend .

# Expose RPC port
EXPOSE 9000

# Copy config file
WORKDIR /root/.boltz
COPY boltz-backend/certificates/tls.cert tls.cert
COPY boltz-backend/certificates/tls.key tls.key 
COPY boltz-backend/boltz.conf boltz.conf 

WORKDIR /opt/boltz-backend

# Start boltz service
ENTRYPOINT ["npm","start"]

