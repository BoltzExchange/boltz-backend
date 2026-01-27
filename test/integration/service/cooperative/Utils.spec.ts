import { Transaction as ScureTransaction } from '@scure/btc-signer';
import { Transaction } from 'bitcoinjs-lib';
import type { Types } from 'boltz-core';
import { Musig, TaprootUtils, swapTree } from 'boltz-core';
import { randomBytes } from 'crypto';
import { hashForWitnessV1, setup, zkp } from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import { getHexBuffer, getHexString } from '../../../../lib/Utils';
import { CurrencyType } from '../../../../lib/consts/Enums';
import Errors from '../../../../lib/service/Errors';
import {
  checkArkTransaction,
  createPartialSignature,
  isPreimageValid,
} from '../../../../lib/service/cooperative/Utils';
import type Wallet from '../../../../lib/wallet/Wallet';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import { bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

describe('Utils', () => {
  const btcCurrency = {
    symbol: 'BTC',
    chainClient: bitcoinClient,
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  beforeAll(async () => {
    await setup();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  test.each`
    preimageHash                                                          | preimage                                                              | valid
    ${'2c23897bdc9514cacefb1976ec0117cddc09baa78a32347505d4f4a689d5fd5a'} | ${'511efb538455acedef1c80cba702fa93f5fef8f1a3f2d67985606fe81576393b'} | ${true}
    ${'2c23897bdc9514cacefb1976ec0117cddc09baa78a32347505d4f4a689d5fd5a'} | ${'511efb538455acedef1c80cba702fa93f5fef8f1a3f2d67985606fe81576393a'} | ${false}
    ${'73a78b658cc8ea4fdbf90dd7dbb2a56aa5984721a9d41b2cd08a2f8b38e85096'} | ${'511efb538455acedef1c80cba702fa93f5fef8f1a3f2d67985606fe81576393'}  | ${false}
  `(
    'should check if preimage is valid',
    ({ preimageHash, preimage, valid }) => {
      expect(
        isPreimageValid(
          {
            preimageHash,
          },
          getHexBuffer(preimage),
        ),
      ).toEqual(valid);
    },
  );

  test('should create partial signatures', async () => {
    const boltzKeys = ECPair.makeRandom();
    const clientKeys = ECPair.makeRandom();

    const tree = swapTree(
      false,
      randomBytes(32),
      Buffer.from(boltzKeys.publicKey),
      Buffer.from(clientKeys.publicKey),
      123,
    );
    const musig = new Musig(
      zkp,
      clientKeys,
      randomBytes(32),
      [boltzKeys.publicKey, clientKeys.publicKey].map(Buffer.from),
    );
    TaprootUtils.tweakMusig(musig, tree.tree);

    const tx = await bitcoinClient.getRawTransaction(
      await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        '',
      ),
    );

    const partialSignature = await createPartialSignature(
      btcCurrency,
      {
        getKeysByIndex: jest.fn().mockReturnValue(boltzKeys),
      } as unknown as Wallet,
      tree,
      0,
      Buffer.from(clientKeys.publicKey),
      Buffer.from(musig.getPublicNonce()),
      tx,
      0,
    );

    musig.aggregateNonces([[boltzKeys.publicKey, partialSignature.pubNonce]]);
    musig.initializeSession(
      await hashForWitnessV1(btcCurrency, Transaction.fromHex(tx), 0),
    );

    expect(
      musig.verifyPartial(
        Buffer.from(boltzKeys.publicKey),
        partialSignature.signature,
      ),
    ).toEqual(true);
  });

  test.each`
    vin
    ${-1}
    ${-23234}
    ${5}
    ${123}
  `(
    'should not create partial signature when vin ($vin) is out of bounds',
    async ({ vin }) => {
      const tx = await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          await bitcoinClient.getNewAddress(''),
          100_000,
          undefined,
          false,
          '',
        ),
      );

      await expect(
        createPartialSignature(
          { type: CurrencyType.BitcoinLike } as Currency,
          {} as Wallet,
          {} as Types.SwapTree,
          1,
          Buffer.alloc(0),
          Buffer.alloc(0),
          tx,
          vin,
        ),
      ).rejects.toEqual(Errors.INVALID_VIN());
    },
  );

  describe('checkArkTransaction', () => {
    test('should throw when checkpoint has more than one input', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: Buffer.alloc(32),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      checkpoint.addInput({
        txid: Buffer.alloc(32),
        index: 1,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);
      checkpoint['inputs'][1].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).toThrow('checkpoint must have exactly one input');
    });

    test('should throw when checkpoint input transaction id does not match lockup transaction id', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: randomBytes(32),
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).toThrow('transaction is not for this swap');
    });

    test('should throw when checkpoint input transaction vout does not match lockup transaction vout', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout - 2,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).toThrow('transaction is not for this swap');
    });

    test('should throw when refund transaction has more than one input', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 1,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);
      refundTx['inputs'][1].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).toThrow('transaction must have exactly one input');
    });

    test('should throw when refund transaction input does not match checkpoint transaction id', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: randomBytes(32),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).toThrow('transaction is not for this swap');
    });

    test('should validate valid Ark transactions', () => {
      const txId = randomBytes(32);
      const vout = 21;

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      expect(() =>
        checkArkTransaction(
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
          getHexString(txId),
          vout,
        ),
      ).not.toThrow();
    });
  });
});
