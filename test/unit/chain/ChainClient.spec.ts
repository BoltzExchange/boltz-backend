import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import ChainTipRepository from '../../../lib/db/repositories/ChainTipRepository';
import type Sidecar from '../../../lib/sidecar/Sidecar';

const relevantInputs = new Set<string>();
const relevantOutputs = new Set<string>();

jest.mock('../../../lib/chain/RpcClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      request: (method: string, args: number) => {
        switch (method) {
          case 'estimatesmartfee': {
            const blocks = args[0];

            return new Promise((resolve) => {
              if (blocks === 2) {
                resolve({
                  feerate: 0.0001064,
                });
              } else {
                resolve({});
              }
            });
          }

          case 'getblockchaininfo':
            return '';
        }

        throw 'method not supported';
      },
    };
  });
});

jest.mock('../../../lib/chain/ZmqClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      relevantInputs,
      relevantOutputs,
      on: () => {},
    };
  });
});

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ChainClient', () => {
  const inputs = [
    '1c56c6503cf6963d58b1b59e699abadd2bfe13be929e9ffc4f531eae2365cffe',
    '4ef4858b59840db6716fd3801eef71dab18e9f0e1046246cc6de4e6e0c93329d',
    'f067aadce5f678f4dca18c100bd14824728bd9b15aa6ab890ee192398aeada96',
    '7fdafa7c0e6aa78b09cd38fc8ef3e494ca4f8e4af4f12ffc79c733a9ed0cff25',
  ];
  const outputs = [
    '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
    '9b0fc92260312ce44e74ef369f5c66bbb85848f2eddd5a7a1cde251e54ccfdd5',
  ];

  const chainClient = new ChainClient(
    Logger.disabledLogger,
    {} as unknown as Sidecar,
    'bitcoinRegtest',
    {
      host: '',
      port: 0,
      cookie: '',
    },
    'BTC',
  );

  chainClient['listenToZmq']();

  beforeEach(() => {
    ChainTipRepository.findOrCreateTip = jest.fn().mockResolvedValue({});
    ChainTipRepository.updateTip = jest.fn().mockResolvedValue(undefined);
  });

  test('should estimate fee', async () => {
    // Verify that the default fee is 2 sats/vbyte
    await expect(
      chainClient.estimateFee(Number.MAX_SAFE_INTEGER),
    ).resolves.toEqual(2);

    // Verify that the fee is calculated correctly
    await expect(chainClient.estimateFee(2)).resolves.toEqual(11);
  });

  test('should add to the output filter', () => {
    outputs.forEach((output) => {
      chainClient.addOutputFilter(getHexBuffer(output));

      expect(relevantOutputs.has(output)).toBeTruthy();
    });

    expect(relevantOutputs.size).toEqual(outputs.length);
  });

  test('should remove from the output filter', () => {
    outputs.forEach((output) => {
      chainClient.removeOutputFilter(getHexBuffer(output));
    });

    expect(relevantOutputs.size).toEqual(0);
  });

  test('should add to the input filter', () => {
    inputs.forEach((output) => {
      chainClient.addInputFilter(getHexBuffer(output));

      expect(relevantInputs.has(output)).toBeTruthy();
    });

    expect(relevantInputs.size).toEqual(inputs.length);
  });

  test('should remove from the input filter', () => {
    inputs.forEach((input) => {
      chainClient.removeInputFilter(getHexBuffer(input));
    });

    expect(relevantInputs.size).toEqual(0);
  });
});
