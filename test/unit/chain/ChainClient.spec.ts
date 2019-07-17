import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import ChainClient from '../../../lib/chain/ChainClient';

const relevantOutputs = new Set<string>();

jest.mock('../../../lib/chain/RpcClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      request: (_: string, args: number) => {
        const blocks = args[0];

        return new Promise((resolve) => {
          if (blocks === 2) {
            resolve({
              feerate: 0.00010640,
            });
          } else {
            resolve({});
          }
        });
      },
    };
  });
});

jest.mock('../../../lib/chain/ZmqClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      relevantOutputs,
      on: () => {},
    };
  });
});

describe('ChainClient', () => {
  const chainClient = new ChainClient(Logger.disabledLogger, {
    host: '',
    port: 0,
    rpcuser: '',
    rpcpass: '',
  }, 'BTC');

  chainClient['listenToZmq']();

  test('should estimate fee', async () => {
    // Verify that the default fee is 2 sats/vbyte
    await expect(chainClient.estimateFee(Number.MAX_SAFE_INTEGER)).resolves.toEqual(2);
    // Verify that the fee is calculated correctly
    await expect(chainClient.estimateFee(2)).resolves.toEqual(11);
  });

  test('should update the output filter', async () => {
    const outputs = [
      '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
      '9b0fc92260312ce44e74ef369f5c66bbb85848f2eddd5a7a1cde251e54ccfdd5',
    ];

    const buffers: Buffer[] = [];

    outputs.forEach((output) => {
      buffers.push(getHexBuffer(output));
    });

    chainClient.updateOutputFilter(buffers);

    expect(relevantOutputs.size).toEqual(outputs.length);

    outputs.forEach((output) => {
      expect(relevantOutputs.has(output)).toBeTruthy();
    });
  });
});
