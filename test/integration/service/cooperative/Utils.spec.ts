import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { Transaction as ScureTransaction } from '@scure/btc-signer';
import type { Types } from 'boltz-core';
import { Musig, TaprootUtils, swapTree } from 'boltz-core';
import { randomBytes } from 'crypto';
import { hashForWitnessV1, setup } from '../../../../lib/Core';
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
    const makeKeys = () => {
      const privateKey = randomBytes(32);
      return {
        privateKey: Buffer.from(privateKey),
        publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
      };
    };
    const boltzKeys = makeKeys();
    const clientKeys = makeKeys();

    const tree = swapTree(
      false,
      randomBytes(32),
      boltzKeys.publicKey,
      clientKeys.publicKey,
      123,
    );

    const tx = await bitcoinClient.getRawTransaction(
      await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        '',
      ),
    );

    const hash = await hashForWitnessV1(
      btcCurrency,
      ScureTransaction.fromRaw(hexToBytes(tx)),
      0,
    );

    const clientMusig = TaprootUtils.tweakMusig(
      Musig.create(clientKeys.privateKey, [
        boltzKeys.publicKey,
        clientKeys.publicKey,
      ]),
      tree.tree,
    )
      .message(hash)
      .generateNonce();

    const partialSignature = await createPartialSignature(
      btcCurrency,
      {
        getKeysByIndex: jest.fn().mockReturnValue(boltzKeys),
      } as unknown as Wallet,
      tree,
      0,
      clientKeys.publicKey,
      Buffer.from(clientMusig.publicNonce),
      tx,
      0,
    );

    const session = clientMusig
      .aggregateNonces([[boltzKeys.publicKey, partialSignature.pubNonce]])
      .initializeSession();

    expect(
      session.verifyPartial(boltzKeys.publicKey, partialSignature.signature),
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
