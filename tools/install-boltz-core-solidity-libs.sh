#!/usr/bin/env bash
# Fetches the foundry solidity dependencies for boltz-core into node_modules/boltz-core/solidity-lib.
# Needed because npm packages do not include git submodules.
# Pinned commits match boltz-core v4.0.5 .gitmodules state.

set -euo pipefail

LIBS_DIR="node_modules/boltz-core/solidity-lib"
mkdir -p "$LIBS_DIR"

fetch() {
  local name="$1"
  local url="$2"
  local commit="$3"
  local target="$LIBS_DIR/$name"

  if [ -d "$target/.git" ] || [ -f "$target/.git" ]; then
    pushd "$target" >/dev/null
    if [ "$(git rev-parse HEAD 2>/dev/null)" = "$commit" ]; then
      popd >/dev/null
      return
    fi
    popd >/dev/null
    rm -rf "$target"
  elif [ -d "$target" ]; then
    rm -rf "$target"
  fi

  git clone --quiet "$url" "$target"
  git -C "$target" checkout --quiet "$commit"
}

fetch forge-std https://github.com/foundry-rs/forge-std 0844d7e1fc5e60d77b68e469bff60265f236c398
fetch openzeppelin-contracts https://github.com/OpenZeppelin/openzeppelin-contracts 5fd1781b1454fd1ef8e722282f86f9293cacf256
fetch permit2 https://github.com/Uniswap/permit2 cc56ad0f3439c502c246fc5cfcc3db92bb8b7219
