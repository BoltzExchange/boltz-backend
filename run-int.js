/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const runTest = (file) => {
  console.log();
  console.log(`Running test: ${file}`);
  childProcess.execSync(`npx jest --testTimeout 10000 ${file}`);
  console.log();
};

let testsRun = 0;
let skipUntil = process.argv[2];
let skip = skipUntil !== undefined;

const execDir = (dir) => {
  const content = fs.readdirSync(dir);

  for (const entry of content) {
    if (entry.includes('.')) {
      if (entry.endsWith('.spec.ts')) {
        if (skip && !entry.includes(skipUntil)) {
          console.log(`Skipping ${path.join(dir, entry)}`);
          continue;
        }
        skip = false;

        runTest(path.join(dir, entry));
        testsRun++;
      }

      continue;
    }

    execDir(path.join(dir, entry));
  }
};

execDir('test/integration');
console.log(`Ran ${testsRun} test suites`);
