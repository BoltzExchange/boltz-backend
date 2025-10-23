/* eslint-disable @typescript-eslint/no-require-imports */

const path = require('path');
const childProcess = require('child_process');

const protoDir = path.join(__dirname, 'proto');
const protoDirHold = path.join(__dirname, 'hold/protos');
const protoDirSidecar = path.join(__dirname, 'boltzr/protos');

const libDir = path.join(__dirname, 'lib/proto');
const protocPath = path.join(
  __dirname,
  'node_modules/.bin/grpc_tools_node_protoc',
);
const protocGenTsPath = path.join(__dirname, 'node_modules/.bin/protoc-gen-ts');

const googleApisPath = path.join(__dirname, 'node_modules/google-proto-files');

const protoPaths = [
  [
    `--proto_path ${protoDir} ${protoDir}/*.proto`,
    libDir,
    ['-I./boltzr/protos'],
  ],
  [`--proto_path ${protoDirSidecar} ${protoDirSidecar}/*.proto`, libDir],
  [`--proto_path ${protoDir} ${protoDir}/**/*.proto`, libDir],
  [
    `--proto_path ${protoDir} ${googleApisPath}/google/api/annotations.proto`,
    libDir,
  ],
  [`--proto_path ${protoDir} ${googleApisPath}/google/api/http.proto`, libDir],
  [
    `--proto_path ${protoDirHold} ${protoDirHold}/*.proto`,
    path.join(libDir, 'hold'),
  ],
];

for (const [path, lib, imports] of protoPaths) {
  try {
    childProcess.execSync(
      `${protocPath} ${[
        `--proto_path ${googleApisPath}`,
        `--grpc_out="grpc_js:${lib}"`,
        `--js_out="import_style=commonjs,binary:${lib}"`,
      ]
        .concat(imports || [])
        .join(' ')} ${path}`,
    );
    childProcess.execSync(
      `${protocPath} ${[
        `--proto_path ${googleApisPath}`,
        `--plugin="protoc-gen-ts=${protocGenTsPath}"`,
        `--ts_out="grpc_js:${lib}"`,
      ]
        .concat(imports || [])
        .join(' ')} ${path}`,
    );
  } catch (e) {
    console.error(`Could not compile protobuf: ${path}`);
    console.log(e);
  }
}
