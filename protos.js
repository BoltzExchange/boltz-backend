const path = require('path');
const childProcess = require('child_process');

const protoDir = path.join(__dirname, 'proto');
const protoDirHold = path.join(__dirname, 'tools/plugins/hold/protos');
const protoDirMpay = path.join(__dirname, 'tools/plugins/mpay/protos');

const libDir = path.join(__dirname, 'lib/proto');
const protocPath = path.join(
  __dirname,
  'node_modules/.bin/grpc_tools_node_protoc',
);
const protocGenTsPath = path.join(__dirname, 'node_modules/.bin/protoc-gen-ts');

const protoPaths = [
  [`--proto_path ${protoDir} ${protoDir}/*.proto`, libDir],
  [`--proto_path ${protoDir} ${protoDir}/**/*.proto`, libDir],
  [
    `--proto_path ${protoDirHold} ${protoDirHold}/*.proto`,
    path.join(libDir, 'hold'),
  ],
  [
    `--proto_path ${protoDirMpay} ${protoDirMpay}/*.proto`,
    path.join(libDir, 'mpay'),
  ],
];

for (const [path, lib] of protoPaths) {
  try {
    childProcess.execSync(
      `${protocPath} ${[
        `--grpc_out="grpc_js:${lib}"`,
        `--js_out="import_style=commonjs,binary:${lib}"`,
      ].join(' ')} ${path}`,
    );
    childProcess.execSync(
      `${protocPath} ${[
        `--plugin="protoc-gen-ts=${protocGenTsPath}"`,
        `--ts_out="grpc_js:${lib}"`,
      ].join(' ')} ${path}`,
    );
  } catch (e) {
    console.error(`Could not compile protobuf: ${path}`);
    console.log(e);
  }
}
