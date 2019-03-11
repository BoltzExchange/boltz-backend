FROM node:8.11.3


# Install general dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
		g++ \
		gcc \
		libc6-dev \
		make \
		pkg-config \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# Install dependencies
RUN apt-get update && apt-get install -y rsync
RUN npm install -g gulp nodemon typescript --quiet
RUN git clone https://github.com/BoltzExchange/boltz-backend
WORKDIR /opt/boltz-backend
RUN npm install

# Expose RPC port
EXPOSE 9000

# Compile TypeScript
RUN npm run compile

WORKDIR $HOME/.boltz
COPY boltz.conf boltz.conf 

WORKDIR /opt/boltz-backend

# Start boltz service
ENTRYPOINT ["npm","start"]
