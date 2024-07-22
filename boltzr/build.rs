fn main() {
    tonic_build::compile_protos("protos/boltzr.proto")
        .unwrap_or_else(|e| panic!("Could build protos: {}", e));
    built::write_built_file()
        .unwrap_or_else(|e| panic!("Failed to acquire build-time information: {}", e));
}
