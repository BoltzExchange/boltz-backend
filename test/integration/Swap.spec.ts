import { crypto, address, ECPair, Transaction } from 'bitcoinjs-lib';
import {
  Scripts,
  Networks,
  detectSwap,
  OutputType,
  swapScript,
  constructClaimTransaction,
  constructRefundTransaction,
} from 'boltz-core';
import { generateAddress } from '../Utils';
import { getHexBuffer } from '../../lib/Utils';
import { bitcoinClient } from './chain/ChainClient.spec';

const { p2shOutput, p2wshOutput, p2shP2wshOutput } = Scripts;

describe('Submarine Swaps', () => {
  const preimage = getHexBuffer('b5b2dbb1f0663878ecbc20323b58b92c');
  const preimageHash = crypto.sha256(preimage);

  const claimKeys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });
  const refundKeys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });

  // Create and send funds to a swap
  const sendFundsToSwap = async (outputFunction: (scriptHex: Buffer) => Buffer, outputType: OutputType) => {
    const { blocks } = await bitcoinClient.getBlockchainInfo();
    const timeoutBlockHeight = blocks + 10;

    const redeemScript = swapScript(preimageHash, claimKeys.publicKey!, refundKeys.publicKey!, timeoutBlockHeight);
    const swapAddress = address.fromOutputScript(outputFunction(redeemScript), Networks.bitcoinRegtest);

    const transactionId = await bitcoinClient.sendToAddress(swapAddress, 10000);
    const transaction = Transaction.fromHex(await bitcoinClient.getRawTransaction(transactionId) as string);

    const { vout, value, script } = detectSwap(redeemScript, transaction)!;

    return {
      redeemScript,
      timeoutBlockHeight,
      swapOutput: {
        vout,
        value,
        script,
        type: outputType,
        txHash: transaction.getHash(),
      },
    };
  };

  const createOutputs = async () => {
    return [
      await sendFundsToSwap(p2wshOutput, OutputType.Bech32),
      await sendFundsToSwap(p2shP2wshOutput, OutputType.Compatibility),
      await sendFundsToSwap(p2shOutput, OutputType.Legacy),
    ];
  };

  test('should execute and claim swaps', async () => {
    const outputs = await createOutputs();

    for (const output of outputs) {
      const { outputScript } = generateAddress(OutputType.Bech32);
      const claimTransaction = constructClaimTransaction(
        [{
          ...output.swapOutput,
          preimage,
          keys: claimKeys,
          redeemScript: output.redeemScript,
        }],
        outputScript,
        1,
        true,
      );

      await bitcoinClient.sendRawTransaction(claimTransaction.toHex());
    }

    await bitcoinClient.generate(1);
  });

  test('should execute and refund swaps', async () => {
    const outputs = await createOutputs();

    // Mine the blocks that are missing to the timeout block height of the swaps
    const { blocks } = await bitcoinClient.getBlockchainInfo();
    await bitcoinClient.generate(outputs[0].timeoutBlockHeight - blocks);

    for (const output of outputs) {
      const { outputScript } = generateAddress(OutputType.Bech32);
      const refundTransaction = constructRefundTransaction(
        [{
          ...output.swapOutput,
          redeemScript: output.redeemScript,
          keys: refundKeys,
        }],
        outputScript,
        output.timeoutBlockHeight,
        1,
      );

      await bitcoinClient.sendRawTransaction(refundTransaction.toHex());
    }

    await bitcoinClient.generate(1);
  });
});
