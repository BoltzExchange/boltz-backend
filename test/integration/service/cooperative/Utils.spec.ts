import { Transaction } from 'bitcoinjs-lib';
import { Musig, TaprootUtils, Types, swapTree } from 'boltz-core';
import { randomBytes } from 'crypto';
import { hashForWitnessV1, setup, zkp } from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import { getHexBuffer } from '../../../../lib/Utils';
import { CurrencyType } from '../../../../lib/consts/Enums';
import Errors from '../../../../lib/service/Errors';
import {
  createPartialSignature,
  isPreimageValid,
} from '../../../../lib/service/cooperative/Utils';
import Wallet from '../../../../lib/wallet/Wallet';
import { Currency } from '../../../../lib/wallet/WalletManager';
import { bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

describe('Utils', () => {
  const btcCurrency = {
    symbol: 'BTC',
    chainClient: bitcoinClient,
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  beforeAll(async () => {
    await Promise.all([setup(), bitcoinClient.connect()]);
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
      boltzKeys.publicKey,
      clientKeys.publicKey,
      123,
    );
    const musig = new Musig(zkp, clientKeys, randomBytes(32), [
      boltzKeys.publicKey,
      clientKeys.publicKey,
    ]);
    TaprootUtils.tweakMusig(musig, tree.tree);

    const tx = await bitcoinClient.getRawTransaction(
      await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(),
        100_000,
      ),
    );

    const partialSignature = await createPartialSignature(
      btcCurrency,
      {
        getKeysByIndex: jest.fn().mockReturnValue(boltzKeys),
      } as unknown as Wallet,
      tree,
      0,
      clientKeys.publicKey,
      Buffer.from(musig.getPublicNonce()),
      tx,
      0,
    );

    musig.aggregateNonces([[boltzKeys.publicKey, partialSignature.pubNonce]]);
    musig.initializeSession(
      await hashForWitnessV1(btcCurrency, Transaction.fromHex(tx), 0),
    );

    expect(
      musig.verifyPartial(boltzKeys.publicKey, partialSignature.signature),
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
          await bitcoinClient.getNewAddress(),
          100_000,
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
});
