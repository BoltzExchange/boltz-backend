/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const childProcess = require('child_process');

const executeCommand = (command) => {
  return childProcess.execSync(command, { encoding: 'utf8' });
};

const getCommitHash = () => {
  const result = executeCommand('git log -1');
  return result.slice(7, 7 + 8);
};

const isDirty = () => {
  const result = executeCommand('git status --short');
  return result.length > 0;
};

const versionFilePath = `${__dirname}/lib/Version.ts`;

try {
  // Delete the version file if it exists
  fs.unlinkSync(versionFilePath);
} catch (error) {
  console.error(`Could not delete file: ${versionFilePath}`, error);
}

const commitHash = getCommitHash();

fs.writeFileSync(
  versionFilePath,
  `export default '${commitHash === '' ? '' : '-' + commitHash}${
    isDirty() ? '-dirty' : ''
  }';\n`,
);
