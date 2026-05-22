/* eslint-disable @typescript-eslint/no-require-imports */

const path = require('path');
const { runTypeChain } = require('typechain');

const cwd = process.cwd();
const outDir = 'lib/wallet/ethereum/typechain';
const files = [
  'node_modules/boltz-core/out/ERC20.sol/ERC20.json',
  'node_modules/boltz-core/out/ERC20Swap.sol/ERC20Swap.json',
  'node_modules/boltz-core/out/EtherSwap.sol/EtherSwap.json',
].map((f) => path.resolve(cwd, f));

runTypeChain({
  cwd,
  filesToProcess: files,
  allFiles: files,
  outDir,
  target: 'ethers-v6',
})
  .then((res) => {
    console.log(`Generated ${res.filesGenerated} typechain files in ${outDir}`);
  })
  .catch((err) => {
    throw err;
  });
