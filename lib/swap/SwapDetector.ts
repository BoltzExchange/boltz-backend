/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { Transaction, Out } from 'bitcoinjs-lib';
import { p2shOutput, p2shP2wshOutput, p2wshOutput } from './Scripts';
import { getHexString } from '../Utils';
import { OutputType } from '../proto/boltzrpc_pb';

/**
 * Detects a swap output with the matching redeem script in a transaction
 */
export const detectSwap = (redeemScript: Buffer, transaction: Transaction) => {
  const scripts = [
    p2shOutput(redeemScript),
    p2shP2wshOutput(redeemScript),
    p2wshOutput(redeemScript),
  ].map(value => getHexString(value));

  let returnValue: { type: OutputType, vout: number } & Out | undefined;

  transaction.outs.forEach((out, vout) => {
    const index = scripts.indexOf(getHexString(out.script));

    const swapOutput = {
      vout,
      script: out.script,
      value: out.value,
    };

    switch (index) {
      case 0:
        returnValue = {
          type: OutputType.LEGACY,
          ...swapOutput,
        };
        break;

      case 1:
        returnValue = {
          type: OutputType.COMPATIBILITY,
          ...swapOutput,
        };
        break;

      case 2:
        returnValue = {
          type: OutputType.BECH32,
          ...swapOutput,
        };
        break;
    }
  });

  return returnValue;
};
