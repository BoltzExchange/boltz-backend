FROM node:lts-alpine


# Install general dependencies
RUN apk update && apk add \
		g++ \
		gcc \
		libc6-compat \
		make \
		pkgconfig \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# Install dependencies
RUN apk update && apk add \ 
		rsync \
		--no-cache git
RUN npm install gulp nodemon typescript --quiet
RUN git clone https://github.com/BoltzExchange/boltz-backend
WORKDIR /opt/boltz-backend
RUN npm install --quiet

# Expose RPC port
EXPOSE 9000

# Compile TypeScript
RUN npm run compile

WORKDIR /root/.boltz
COPY boltz.conf boltz.conf 

WORKDIR /opt/boltz-backend

# Start boltz service
ENTRYPOINT ["npm","start"]

