#!/bin/bash

function print () {
  echo -e "\e[32mBuilding $1\e[0m"
}

print "boltz-backend image"
docker build -t boltz/backend -f boltz-backend/Dockerfile .

print "boltz-middleware image"
docker build -t boltz/middleware -f boltz-middleware/Dockerfile .
