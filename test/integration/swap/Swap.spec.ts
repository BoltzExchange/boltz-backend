// tslint:disable:max-line-length
import { crypto, address, ECPair } from 'bitcoinjs-lib';
import { Networks, Scripts, pkRefundSwap, constructClaimTransaction, constructRefundTransaction, TransactionOutput, OutputType } from 'boltz-core';
import { getHexBuffer } from '../../../lib/Utils';
import { btcManager, btcdClient, btcAddress } from '../chain/ChainClient.spec';

const { p2shOutput, p2wshOutput, p2shP2wshOutput } = Scripts;

describe('Submarine Swaps', () => {
  const preimage = getHexBuffer('b5b2dbb1f0663878ecbc20323b58b92c');
  const preimageHash = crypto.sha256(preimage);

  const claimKeys = ECPair.makeRandom({ network: Networks.bitcoinSimnet });
  const refundKeys = ECPair.makeRandom({ network: Networks.bitcoinSimnet });

  // Create and send funds to a Swap
  const sendFundsToSwap = async (outputFunction: (scriptHex: Buffer) => Buffer, outputType: OutputType) => {
    const { blocks } = await btcdClient.getInfo();
    const timeoutBlockHeight = blocks + 10;

    const redeemScript = pkRefundSwap(preimageHash, claimKeys.publicKey, refundKeys.publicKey, timeoutBlockHeight);
    const swapAddress = address.fromOutputScript(outputFunction(redeemScript), Networks.bitcoinSimnet);

    const transaction = btcManager.constructTransaction(swapAddress, 10000);
    await btcManager.broadcastAndMine(transaction.toHex());

    const swapVout = 1;
    const transactionOutput = transaction.outs[swapVout];
    return {
      redeemScript,
      timeoutBlockHeight,
      swapOutput: {
        txHash: transaction.getHash(),
        vout: swapVout,
        type: outputType,
        script: transactionOutput.script,
        value: transactionOutput.value,
      },
    };
  };

  const claimSwap = async (swapOutput: TransactionOutput, redeemScript: Buffer) => {
    const destinationScript = address.toOutputScript(btcAddress, Networks.bitcoinSimnet);
    const claimTransaction = constructClaimTransaction(
      [{
        ...swapOutput,
        preimage,
        redeemScript,
        keys: claimKeys,
      }],
      destinationScript,
      1,
      true,
    );

    await btcManager.broadcastAndMine(claimTransaction.toHex());
  };

  const refundSwap = async (swapOutput: TransactionOutput, redeemScript: Buffer, timeoutBlockHeight: number) => {
    const destinationScript = address.toOutputScript(btcAddress, Networks.bitcoinSimnet);
    const refundTransaction = constructRefundTransaction(
      [{
        ...swapOutput,
        redeemScript,
        keys: refundKeys,
      }],
      destinationScript,
      timeoutBlockHeight,
      1,
    );

    await btcManager.broadcastAndMine(refundTransaction.toHex());
  };

  const createOutputs = async () => {
    return [
      await sendFundsToSwap(p2wshOutput, OutputType.Bech32),
      await sendFundsToSwap(p2shP2wshOutput, OutputType.Compatibility),
      await sendFundsToSwap(p2shOutput, OutputType.Legacy),
    ];
  };

  before(async () => {
    await btcdClient.connect();
  });

  it('should execute and claim swaps', async () => {
    const outputs = await createOutputs();

    for (const output of outputs) {
      await claimSwap(output.swapOutput, output.redeemScript);
    }
  });

  it('should execute and refund swaps', async () => {
    const outputs = await createOutputs();

    for (const output of outputs) {
      await refundSwap(output.swapOutput, output.redeemScript, output.timeoutBlockHeight);
    }
  });

  after(async () => {
    await btcdClient.disconnect();
  });
});
