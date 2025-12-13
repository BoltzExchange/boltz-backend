import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexBuffer } from '../../../lib/Utils';
import ArkClient from '../../../lib/chain/ArkClient';
import TransactionLabelRepository from '../../../lib/db/repositories/TransactionLabelRepository';
import { waitForFunctionToBeTrue } from '../../Utils';
import { arkClient, bitcoinClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ArkClient', () => {
  beforeAll(async () => {
    await bitcoinClient.connect();
    await arkClient.connect(bitcoinClient);
  });

  afterAll(() => {
    arkClient.disconnect();
    bitcoinClient.disconnect();
  });

  const createVHtlc = async (
    refundDelay: number = 20,
    claimPublicKey?: Buffer,
    refundPublicKey?: Buffer,
  ) => {
    const preimage = randomBytes(32);

    const { vHtlc, timeouts } = await arkClient.createVHtlc(
      crypto.sha256(preimage),
      refundDelay,
      claimPublicKey,
      refundPublicKey,
    );

    return {
      vHtlc,
      timeouts,
      preimage,
    };
  };

  test('should connect to the Ark node', async () => {
    await expect(arkClient.connect(bitcoinClient)).resolves.toBe(true);
  });

  test('should get block height', async () => {
    const blockHeight = await arkClient.getBlockHeight();
    expect(blockHeight).toBeGreaterThan(0);
    expect((await bitcoinClient.getBlockchainInfo()).blocks).toEqual(
      blockHeight,
    );
  });

  test('should get balance', async () => {
    const balance = await arkClient.getBalance();
    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.unconfirmedBalance).toBe(0);
  });

  test('should get address', async () => {
    const address = await arkClient.getAddress();
    expect(address.boardingAddress).toBeDefined();
    expect(address.boardingAddress.startsWith('bcrt')).toEqual(true);

    expect(address.address).toBeDefined();
    expect(address.address.startsWith('tark')).toEqual(true);

    expect(address.publicKey).toBeDefined();
  });

  test('should send offchain', async () => {
    TransactionLabelRepository.addLabel = jest.fn();

    const address = await arkClient.getAddress();
    const amount = 1_234;
    const label = 'test';

    const txid = await arkClient.sendOffchain(address.address, amount, label);
    expect(txid).toBeDefined();

    const tx = await arkClient.getTx(txid);
    expect(tx.outputsLength).toEqual(3);
    expect(tx.getOutput(0).amount).toEqual(BigInt(amount));

    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      txid,
      ArkClient.symbol,
      label,
    );
  });

  test('should create vHTLCs', async () => {
    const refundDelay = 23;
    const { vHtlc, timeouts } = await createVHtlc(
      refundDelay,
      Buffer.from(ECPair.makeRandom().publicKey),
    );

    expect(vHtlc.address.startsWith('tark')).toEqual(true);

    const blockHeight = await arkClient.getBlockHeight();
    const blockTimestamp = await arkClient.getBlockTimestamp(blockHeight);
    expect(timeouts.refund).toEqual(
      blockTimestamp +
        Math.round(Math.ceil((refundDelay * 10 * 60) / 512)) * 512,
    );

    expect(timeouts.unilateralClaim).toEqual(9728);
    expect(timeouts.unilateralRefund).toEqual(19456);
    expect(timeouts.unilateralRefundWithoutReceiver).toEqual(38400);
  });

  test('should claim vHTLCs', async () => {
    const refundPublicKey = Buffer.from(ECPair.makeRandom().publicKey);

    const { vHtlc, preimage } = await createVHtlc(
      undefined,
      undefined,
      refundPublicKey,
    );

    const balanceBefore = (await arkClient.getBalance()).confirmedBalance;

    const amount = 1000;
    await arkClient.sendOffchain(vHtlc.address, amount, 'lockup');

    await waitForFunctionToBeTrue(async () => {
      return (await arkClient.getBalance()).confirmedBalance < balanceBefore;
    });

    const info = await arkClient.getInfo();
    const label = 'claim';
    const claimTxId = await arkClient.claimVHtlc(
      preimage,
      refundPublicKey,
      getHexBuffer(info.pubkey),
      label,
    );
    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      claimTxId,
      ArkClient.symbol,
      label,
    );

    await waitForFunctionToBeTrue(async () => {
      return (await arkClient.getBalance()).confirmedBalance === balanceBefore;
    });

    expect((await arkClient.getBalance()).confirmedBalance).toEqual(
      balanceBefore,
    );
  });

  // TODO: this throws "2 UNKNOWN: forfeit closure is CLTV locked, 48000 > 1750885681 (block time)"
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('should refund vHTLCs', async () => {
    const refundPublicKey = Buffer.from(ECPair.makeRandom().publicKey);
    const claimPublicKey = Buffer.from(ECPair.makeRandom().publicKey);

    const { vHtlc, preimage } = await createVHtlc(
      undefined,
      claimPublicKey,
      refundPublicKey,
    );

    const balanceBefore = (await arkClient.getBalance()).confirmedBalance;

    const amount = 1000;
    await arkClient.sendOffchain(vHtlc.address, amount, 'lockup');

    await waitForFunctionToBeTrue(async () => {
      return (await arkClient.getBalance()).confirmedBalance < balanceBefore;
    });

    const label = 'refund';
    const refundTxId = await arkClient.refundVHtlc(
      crypto.sha256(preimage),
      refundPublicKey,
      claimPublicKey,
      label,
    );
    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      refundTxId,
      ArkClient.symbol,
      label,
    );

    expect((await arkClient.getBalance()).confirmedBalance).toEqual(
      balanceBefore,
    );
  });

  test('should create vHtlc ids', async () => {
    const preimage = randomBytes(32);
    const preimageHash = crypto.sha256(preimage);
    const receiverPubkey = Buffer.from(ECPair.makeRandom().publicKey);

    const { vHtlc } = await arkClient.createVHtlc(
      preimageHash,
      20,
      receiverPubkey,
    );

    const expectedId = ArkClient.createVhtlcId(
      preimageHash,
      getHexBuffer((await arkClient.getInfo()).pubkey),
      receiverPubkey,
    );

    expect(vHtlc.id).toEqual(expectedId);
  });

  describe('decodeAddress', () => {
    test('should decode address', () => {
      expect(
        ArkClient.decodeAddress(
          'tark1qr340xg400jtxat9hdd0ungyu6s05zjtdf85uj9smyzxshf98ndakjpdlzx4q6n5was20sqf5kff8999rupjsl2ptlz3nqtkl6hv27fvrc05ag',
        ),
      ).toEqual({
        serverPubKey: getHexBuffer(
          'e35799157be4b37565bb5afe4d04e6a0fa0a4b6a4f4e48b0d904685d253cdbdb',
        ),
        tweakedPubKey: getHexBuffer(
          '482df88d506a747760a7c009a5929394a51f03287d415fc5198176feaec5792c',
        ),
      });
    });

    test.each([
      ['invalid address', 'invalid'],
      ['empty address', ''],
      ['null address', null as unknown as string],
      ['undefined address', undefined as unknown as string],
    ])('should throw error for %s', (_, address) => {
      expect(() => {
        ArkClient.decodeAddress(address);
      }).toThrow('invalid address');
    });
  });

  describe('listenBlocks', () => {
    test('should listen to block heights', async () => {
      arkClient['useLocktimeSeconds'] = false;

      const blockHeight = await arkClient.getBlockHeight();

      const emitPromise = new Promise<void>((resolve) => {
        arkClient.on('block', (block) => {
          expect(block).toEqual({
            height: blockHeight + 1,
          });
          arkClient.removeAllListeners('block');
          resolve();
        });
      });

      await bitcoinClient.generate(1);
      await arkClient['listenBlocks']({
        height: blockHeight + 1,
        symbol: 'BTC',
      });

      await emitPromise;

      arkClient['useLocktimeSeconds'] = true;
    });

    test('should listen to block median times when using locktime seconds', async () => {
      arkClient['useLocktimeSeconds'] = true;

      const blockHeight = await arkClient.getBlockHeight();

      const emitPromise = new Promise<void>((resolve) => {
        arkClient.on('block', (block) => {
          expect(block.height).toBeUndefined();
          expect(block.medianTime).toBeDefined();
          expect(block.medianTime).toBeGreaterThan(0);
          arkClient.removeAllListeners('block');
          resolve();
        });
      });

      await bitcoinClient.generate(1);
      await arkClient['listenBlocks']({
        height: blockHeight + 1,
        symbol: 'BTC',
      });

      await emitPromise;
    });
  });

  describe('getTx', () => {
    test('should get transactions', async () => {
      const txId = await arkClient.sendOffchain(
        (await arkClient.getAddress()).address,
        10_000,
        'test',
      );

      const tx = await arkClient.getTx(txId);

      expect(tx).toBeDefined();
      expect(tx.inputsLength).toBeGreaterThanOrEqual(1);
      expect(tx.outputsLength).toEqual(3);
    });

    test('should throw an error if the transaction is not found', async () => {
      await expect(
        arkClient.getTx(randomBytes(32).toString('hex')),
      ).rejects.toThrow('transaction not found');
    });
  });

  test('should map inputs', async () => {
    const txId = await arkClient.sendOffchain(
      (await arkClient.getAddress()).address,
      10_000,
      'test',
    );

    const tx = await arkClient.getTx(txId);

    expect(ArkClient.mapInputs(tx)).toHaveLength(tx.inputsLength);
    for (let i = 0; i < tx.inputsLength; i++) {
      expect(ArkClient.mapInputs(tx)[i]).toEqual(tx.getInput(i));
    }
  });

  test('should map outputs', async () => {
    const txId = await arkClient.sendOffchain(
      (await arkClient.getAddress()).address,
      10_000,
      'test',
    );

    const tx = await arkClient.getTx(txId);

    expect(ArkClient.mapOutputs(tx)).toHaveLength(tx.outputsLength);
    for (let i = 0; i < tx.outputsLength; i++) {
      expect(ArkClient.mapOutputs(tx)[i]).toEqual(tx.getOutput(i));
    }
  });
});
