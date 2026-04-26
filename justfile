_default:
    @just --list

# === Rust workspace ===

# Compile boltz-core under every supported feature combination.
boltz-core-features:
    #!/usr/bin/env bash
    set -euo pipefail
    for features in "" "bitcoin" "musig" "elements" "bitcoin,musig" "elements,musig" "bitcoin,elements" "bitcoin,elements,musig"; do
        echo "=== features: ${features:-<none>} ==="
        cargo check -p boltz-core --no-default-features --features "$features"
    done

# Build boltz-core rustdoc with warnings as errors and run all doctests.
boltz-core-docs:
    RUSTDOCFLAGS='-D warnings' cargo doc -p boltz-core --all-features --no-deps
    cargo test -p boltz-core --all-features --doc

# Compile boltzr under every supported feature combination.
boltzr-features:
    #!/usr/bin/env bash
    set -euo pipefail
    for features in "" "metrics" "loki" "otel" "metrics,loki" "metrics,otel" "loki,otel" "metrics,loki,otel"; do
        echo "=== features: ${features:-<none>} ==="
        cargo check -p boltzr --no-default-features --features "$features"
    done

# Generate a new diesel migration under boltzr/migrations/ (e.g. `just migration add_foo`).
migration name:
    diesel migration generate --migration-dir boltzr/migrations {{ name }}

# Run clippy with the exact flags CI uses (warnings = errors).
clippy:
    cargo clippy --all-targets --all-features -- -D warnings

# === Formatting (Rust + TS/SQL/etc.) ===

# Check formatting for everything CI checks.
fmt-check:
    cargo fmt --check
    npm run prettier:check

# Auto-format Rust and TypeScript/SQL/etc.
fmt:
    cargo fmt
    npm run prettier:write

# === Aggregate ===

# Replay the build-rust CI job locally.
ci-rust: fmt-check clippy boltz-core-features boltz-core-docs
    cargo test

# === Regtest / dev environment ===

# Start the full regtest stack (Docker + DB + smart contracts + nginx).
regtest-start:
    npm run regtest:start

# Stop the regtest stack.
regtest-stop:
    npm run regtest:stop

# === Tests ===

# Run TypeScript unit tests.
test-unit:
    npm run test:unit

# Run TypeScript integration tests (requires regtest running).
test-integration:
    node run-int.js

# === API / codegen ===

# Regenerate gRPC stubs from .proto files.
proto:
    npm run proto

# Regenerate swagger-spec.json from JSDoc.
swagger:
    npm run swagger

# Validate swagger-spec.json against OpenAPI 3.0 (matches CI).
swagger-validate:
    npm run swagger:validate
