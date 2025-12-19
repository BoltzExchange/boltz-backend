fn main() {
    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .type_attribute(".", "#[derive(serde::Serialize)]")
        .compile_protos(&["../boltzr/protos/boltzr.proto"], &["../boltzr/protos"])
        .unwrap_or_else(|e| panic!("Could not build boltz protos: {e}"));

    tonic_prost_build::configure()
        .protoc_arg("--experimental_allow_proto3_optional")
        .type_attribute(".", "#[derive(serde::Serialize)]")
        .compile_protos(
            &["../proto/boltzrpc.proto"],
            &["../proto", "../boltzr/protos"],
        )
        .unwrap_or_else(|e| panic!("Could not build boltz protos: {e}"));
}
