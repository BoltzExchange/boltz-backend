fn main() {
    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&["protos/boltzr.proto"], &["protos"])
        .unwrap_or_else(|e| panic!("Could not build protos: {e}"));

    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&["../proto/lnd/rpc.proto"], &["../proto"])
        .unwrap_or_else(|e| panic!("Could not build LND protos: {e}"));

    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&["../proto/cln/node.proto"], &["../proto"])
        .unwrap_or_else(|e| panic!("Could not build CLN protos: {e}"));

    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&["../hold/protos/hold.proto"], &["../hold/protos"])
        .unwrap_or_else(|e| panic!("Could not build CLN hold protos: {e}"));

    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(
            &["../proto/ark/service.proto"],
            &["../proto", "../node_modules/google-proto-files"],
        )
        .unwrap_or_else(|e| panic!("Could not build ARK service protos: {e}"));

    built::write_built_file()
        .unwrap_or_else(|e| panic!("Failed to acquire build-time information: {e}"));
}
