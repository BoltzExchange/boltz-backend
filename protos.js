/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
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
const protocGenTsProtoPath = path.join(
  __dirname,
  'node_modules/.bin/protoc-gen-ts_proto',
);

const googleApisPath = path.join(__dirname, 'node_modules/google-proto-files');
const googleApiFiles = [
  path.join(googleApisPath, 'google/api/annotations.proto'),
  path.join(googleApisPath, 'google/api/http.proto'),
];
const protoDependencies = [
  ['google-proto-files', googleApisPath],
  ['grpc-tools', protocPath],
  ['ts-proto', protocGenTsProtoPath],
];

const baseTsProtoOptions = [
  'emitImportedFiles=false',
  'env=node',
  'esModuleInterop=true',
  'forceLong=string',
  'outputServices=grpc-js',
];

const tsProtoOptions = baseTsProtoOptions.join(',');

const getMissingProtoDependencies = () =>
  protoDependencies.filter(
    ([, dependencyPath]) => !fs.existsSync(dependencyPath),
  );

const areDevDependenciesOmitted = () => {
  const omittedDependencies = new Set(
    (process.env.npm_config_omit || '')
      .split(/[,\s]+/)
      .filter((value) => value !== ''),
  );

  return omittedDependencies.has('dev');
};

const getProtoFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getProtoFiles(entryPath);
    }

    return entry.name.endsWith('.proto') ? [entryPath] : [];
  });

const generateProtoFiles = ({ files, outputDir, protoPaths, options }) => {
  if (files.length === 0) {
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  childProcess.execFileSync(
    protocPath,
    [
      `--plugin=protoc-gen-ts_proto=${protocGenTsProtoPath}`,
      ...protoPaths.map((protoPath) => `--proto_path=${protoPath}`),
      `--ts_proto_out=${outputDir}`,
      `--ts_proto_opt=${options || tsProtoOptions}`,
      ...files,
    ],
    {
      stdio: 'inherit',
    },
  );
};

const patchGeneratedFiles = () => {
  const clnNodePath = path.join(libDir, 'cln/node.ts');

  if (!fs.existsSync(clnNodePath)) {
    return;
  }

  const content = fs.readFileSync(clnNodePath, 'utf8');
  const patchedContent = content
    .replace(/\n {2}close: \{/g, '\n  closeRpc: {')
    .replace(
      /\n {2}close: handleUnaryCall<CloseRequest, CloseResponse>;/g,
      '\n  closeRpc: handleUnaryCall<CloseRequest, CloseResponse>;',
    )
    .replace(/\n {2}close\(/g, '\n  closeRpc(');

  fs.writeFileSync(clnNodePath, patchedContent);
};

const main = () => {
  const missingProtoDependencies = getMissingProtoDependencies();

  if (missingProtoDependencies.length !== 0) {
    const missingPackages = missingProtoDependencies
      .map(([dependency]) => dependency)
      .join(', ');
    const message = `Missing protobuf generation dependencies: ${missingPackages}`;

    if (areDevDependenciesOmitted()) {
      console.warn(
        `${message}; skipping protobuf generation because dev dependencies were omitted.`,
      );
      return;
    }

    throw new Error(message);
  }

  const protoJobs = [
    {
      files: getProtoFiles(protoDir).filter(
        (file) => !file.startsWith(path.join(protoDir, 'cln')),
      ),
      outputDir: libDir,
      protoPaths: [protoDir, protoDirSidecar, googleApisPath],
    },
    {
      files: getProtoFiles(path.join(protoDir, 'cln')),
      outputDir: libDir,
      protoPaths: [protoDir, googleApisPath],
    },
    {
      files: getProtoFiles(protoDirSidecar),
      outputDir: libDir,
      protoPaths: [protoDirSidecar, googleApisPath],
    },
    {
      files: googleApiFiles,
      outputDir: libDir,
      protoPaths: [googleApisPath],
    },
    {
      files: getProtoFiles(protoDirHold),
      outputDir: path.join(libDir, 'hold'),
      protoPaths: [protoDirHold, googleApisPath],
    },
  ];

  for (const job of protoJobs) {
    try {
      generateProtoFiles(job);
    } catch (error) {
      console.error(`Could not compile protobuf into ${job.outputDir}`);
      console.error(error);
      process.exitCode = 1;
    }
  }

  if (process.exitCode !== 1) {
    patchGeneratedFiles();
  }
};

main();
