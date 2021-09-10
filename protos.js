const path = require('path');
const childProcess = require('child_process');

const PROTO_DIR = path.join(__dirname, 'proto');
const LIB_DIR = path.join(__dirname, 'lib/proto');
const PROTOC_GEN_TS_PATH = path.join(__dirname, 'node_modules/.bin/protoc-gen-ts');

const protoConfig = [
  `--plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}"`,
  `--grpc_out="grpc_js:${LIB_DIR}"`,
  `--js_out="import_style=commonjs,binary:${LIB_DIR}"`,
  `--ts_out="grpc_js:${LIB_DIR}"`,
  `--proto_path ${PROTO_DIR} ${PROTO_DIR}/**/*.proto`,
];

const PROTOC_PATH = path.join(__dirname, 'node_modules/.bin/grpc_tools_node_protoc');

childProcess.execSync(`${PROTOC_PATH} ${protoConfig.join(' ')}`);
