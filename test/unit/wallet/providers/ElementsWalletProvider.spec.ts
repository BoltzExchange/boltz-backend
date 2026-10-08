import { networks } from 'liquidjs-lib';
import Logger from '../../../../lib/Logger';
import type { IElementsClient } from '../../../../lib/chain/ElementsClient';
import RpcClient from '../../../../lib/chain/RpcClient';
import ElementsWalletProvider from '../../../../lib/wallet/providers/ElementsWalletProvider';
import NotBroadcastError from '../../../../lib/wallet/providers/NotBroadcastError';

describe('ElementsWalletProvider', () => {
  const provider = (sendToAddress: jest.Mock) =>
    new ElementsWalletProvider(
      Logger.disabledLogger,
      {
        symbol: 'L-BTC',
        sendToAddress,
      } as unknown as IElementsClient,
      networks.regtest,
    );

  test('should mark a refusal by the node as not broadcast', async () => {
    const refusal = RpcClient.markNodeError({
      code: -6,
      message: 'Insufficient funds',
    });
    await expect(
      provider(jest.fn().mockRejectedValue(refusal)).sendToAddress(
        'el1q',
        1,
        2,
        'label',
      ),
    ).rejects.toBeInstanceOf(NotBroadcastError);
  });

  test('should not mark a lost answer as not broadcast', async () => {
    const lost = new Error('socket hang up');
    await expect(
      provider(jest.fn().mockRejectedValue(lost)).sendToAddress(
        'el1q',
        1,
        2,
        'label',
      ),
    ).rejects.toBe(lost);
  });
});
