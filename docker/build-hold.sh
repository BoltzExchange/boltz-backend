#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
HOLD_DIR="${PROJECT_ROOT}/hold"
HOST_PLUGIN_PATH="${PROJECT_ROOT}/docker/regtest/data/cln/plugins/hold"

mkdir -p "$(dirname "${HOST_PLUGIN_PATH}")"

if [[ "$(uname -s)" == "Linux" ]]; then
  CURRENT_DIR=$(pwd)
  cd "${HOLD_DIR}"
  cargo build
  cp target/debug/hold "${HOST_PLUGIN_PATH}"
  cd "${CURRENT_DIR}"
else
  BUILD_STAGE_IMAGE_TAG="boltz/hold-plugin-builder:build-stage"
  CONTAINER_BINARY_PATH="/hold/target/release/hold"

  docker build --target build -t "${BUILD_STAGE_IMAGE_TAG}" "${HOLD_DIR}"
  BUILDER_ID=$(docker create "${BUILD_STAGE_IMAGE_TAG}")

  cleanup() {
      docker rm -f "${BUILDER_ID}" > /dev/null
  }
  trap cleanup EXIT

  docker cp "${BUILDER_ID}:${CONTAINER_BINARY_PATH}" "${HOST_PLUGIN_PATH}"
  sleep 1
fi

docker exec regtest lightning-cli plugin start /root/.lightning/plugins/hold || echo "Failed to start hold plugin via docker exec"
docker exec regtest chmod -R 777 /root/.lightning/regtest/hold || echo "Failed to chmod hold via docker exec"
