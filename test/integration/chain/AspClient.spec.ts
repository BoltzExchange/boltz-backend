import { Transaction } from '@scure/btc-signer';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexBuffer } from '../../../lib/Utils';
import AspClient from '../../../lib/chain/AspClient';
import { arkClient, arpUrl, bitcoinClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/TransactionLabelRepository');

describe('AspClient', () => {
  const client = new AspClient(arpUrl);

  beforeAll(async () => {
    await arkClient.connect(bitcoinClient);
  });

  afterAll(() => {
    arkClient.disconnect();
  });

  describe('constructor', () => {
    test.each([
      ['empty string', ''],
      ['undefined', undefined as unknown as string],
    ])('throws an error if URL is %s', (_, url) => {
      expect(() => new AspClient(url)).toThrow('ASP is not set');
    });

    test('strips trailing slash from URL', () => {
      const client = new AspClient(`${arpUrl}/`);
      expect(client['url']).toBe(arpUrl);
    });
  });

  test('should get info', async () => {
    const info = await client.getInfo();
    expect(info.pubkey).toBeDefined();
    expect(ECPair.isPoint(getHexBuffer(info.pubkey))).toEqual(true);
  });

  describe('getTx', () => {
    test('should get transactions', async () => {
      const txId = await arkClient.sendOffchain(
        (await arkClient.getAddress()).address,
        10_000,
        'test',
      );

      const tx = await client.getTx(txId);

      expect(tx).toBeInstanceOf(Transaction);
      expect(tx.inputsLength).toBeGreaterThanOrEqual(1);
      expect(tx.outputsLength).toEqual(2);
    });

    test('should throw an error if the transaction is not found', async () => {
      await expect(
        client.getTx(randomBytes(32).toString('hex')),
      ).rejects.toThrow('transaction not found');
    });
  });
});
