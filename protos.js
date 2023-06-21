const path = require('path');
const childProcess = require('child_process');

const PROTO_DIR = path.join(__dirname, 'proto');
const LIB_DIR = path.join(__dirname, 'lib/proto');
const PROTOC_PATH = path.join(
  __dirname,
  'node_modules/.bin/grpc_tools_node_protoc',
);
const PROTOC_GEN_TS_PATH = path.join(
  __dirname,
  'node_modules/.bin/protoc-gen-ts',
);

const protoConfig = [
  `--grpc_out="grpc_js:${LIB_DIR}"`,
  `--js_out="import_style=commonjs,binary:${LIB_DIR}"`,
];

const protoTypesConfig = [
  `--plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}"`,
  `--ts_out="grpc_js:${LIB_DIR}"`,
];

const protoPaths = [
  `--proto_path ${PROTO_DIR} ${PROTO_DIR}/*.proto`,
  `--proto_path ${PROTO_DIR} ${PROTO_DIR}/**/*.proto`,
];

for (const path of protoPaths) {
  try {
    childProcess.execSync(`${PROTOC_PATH} ${protoConfig.join(' ')} ${path}`);
    childProcess.execSync(
      `${PROTOC_PATH} ${protoTypesConfig.join(' ')} ${path}`,
    );
  } catch (e) {
    console.error(`Could not compile protobuf: ${path}`);
    console.log(e);
  }
}
