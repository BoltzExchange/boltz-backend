import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexBuffer } from '../../../lib/Utils';
import ArkClient, {
  type CreatedVHtlc,
  type SpentVHtlc,
} from '../../../lib/chain/ArkClient';
import TransactionLabelRepository from '../../../lib/db/repositories/TransactionLabelRepository';
import { waitForFunctionToBeTrue } from '../../Utils';
import { arkClient, aspUrl, bitcoinClient } from '../Nodes';

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
    claimDelay: number = 10,
    refundDelay: number = 20,
    claimPublicKey: Buffer = Buffer.from(ECPair.makeRandom().publicKey),
  ) => {
    const preimage = randomBytes(32);

    const { vHtlc, timeouts } = await arkClient.createVHtlc(
      crypto.sha256(preimage),
      claimDelay,
      refundDelay,
      claimPublicKey,
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
    expect(tx.outputsLength).toEqual(2);
    expect(tx.getOutput(0).amount).toEqual(BigInt(amount));

    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      txid,
      ArkClient.symbol,
      label,
    );
  });

  test('should create vHTLCs', async () => {
    const claimDelay = 21;
    const refundDelay = 23;
    const { vHtlc, timeouts } = await createVHtlc(claimDelay, refundDelay);

    expect(vHtlc.address.startsWith('tark')).toEqual(true);

    const blockHeight = await arkClient.getBlockHeight();
    expect(timeouts.unilateralClaim).toEqual(blockHeight + claimDelay);
    expect(timeouts.unilateralRefund).toEqual(blockHeight + refundDelay);
    expect(timeouts.unilateralRefundWithoutReceiver).toEqual(
      blockHeight + refundDelay,
    );
  });

  test('should claim vHTLCs', async () => {
    const info = await arkClient.getInfo();
    const { vHtlc, preimage } = await createVHtlc(
      undefined,
      undefined,
      getHexBuffer(info.pubkey),
    );

    const balanceBefore = (await arkClient.getBalance()).confirmedBalance;

    const amount = 1000;
    await arkClient.sendOffchain(vHtlc.address, amount, 'lockup');

    await waitForFunctionToBeTrue(async () => {
      return (await arkClient.getBalance()).confirmedBalance < balanceBefore;
    });

    const label = 'claim';
    const claimTxId = await arkClient.claimVHtlc(preimage, label);
    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      claimTxId,
      ArkClient.symbol,
      label,
    );

    expect((await arkClient.getBalance()).confirmedBalance).toEqual(
      balanceBefore,
    );
  });

  // TODO: this throws "2 UNKNOWN: forfeit closure is CLTV locked, 48000 > 1750885681 (block time)"
  test.skip('should refund vHTLCs', async () => {
    const info = await arkClient.getInfo();
    const { vHtlc, preimage } = await createVHtlc(
      undefined,
      0,
      getHexBuffer(info.pubkey),
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

  test.todo('should rescan');

  describe('decodeAddress', () => {
    test('should decode address', () => {
      expect(
        ArkClient.decodeAddress(
          'tark1sg9n0wd5r8x4dj68ux8t2hudvzl0ajukqck9ef0rg4c63afkvm800my34z8qtcr4vh934s933vh60y9sahzmp6d9ry833ts20ljs06cmpz069',
        ),
      ).toEqual({
        serverPubKey: getHexBuffer(
          '820b37b9b419cd56cb47e18eb55f8d60befecb96062c5ca5e34571a8f53666ce',
        ),
        tweakedPubKey: getHexBuffer(
          'f7ec91a88e05e07565cb1ac0b18b2fa790b0edc5b0e9a5190f18ae0a7fe507eb',
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

  test('should stream vHTLCs', async () => {
    const info = await arkClient.getInfo();
    const { vHtlc, preimage } = await createVHtlc(
      undefined,
      undefined,
      getHexBuffer(info.pubkey),
    );

    await arkClient.subscribeAddresses([
      {
        address: vHtlc.address,
        preimageHash: crypto.sha256(preimage),
      },
    ]);

    const createdPromise = new Promise<CreatedVHtlc>((resolve) => {
      arkClient.on('vhtlc.created', (vhtlc) => {
        resolve(vhtlc);
      });
    });

    const amount = 1000;
    const lockupTxId = await arkClient.sendOffchain(
      vHtlc.address,
      amount,
      'lockup',
    );

    const createdVHtlc = await createdPromise;
    expect(createdVHtlc.address).toEqual(vHtlc.address);
    expect(createdVHtlc.txId).toEqual(lockupTxId);
    expect(createdVHtlc.vout).toEqual(0);
    expect(createdVHtlc.amount).toEqual(amount);

    const spentPromise = new Promise<SpentVHtlc>((resolve) => {
      arkClient.on('vhtlc.spent', (vhtlc) => {
        resolve(vhtlc);
      });
    });

    const claimTxId = await arkClient.claimVHtlc(preimage, 'claim');

    const spentVHtlc = await spentPromise;
    expect(spentVHtlc.outpoint.txid).toEqual(lockupTxId);
    expect(spentVHtlc.outpoint.vout).toEqual(0);
    expect(spentVHtlc.spentBy).toEqual(claimTxId);
  });

  test('should listen to blocks', async () => {
    const blockHeight = await arkClient.getBlockHeight();

    const emitPromise = new Promise<void>((resolve) => {
      arkClient.on('block', (block) => {
        expect(block).toEqual(blockHeight + 1);
        resolve();
      });
    });

    await bitcoinClient.generate(1);

    await emitPromise;
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
      expect(tx.outputsLength).toEqual(2);
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
