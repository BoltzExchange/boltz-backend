import type { TransactionResponse } from 'ethers';
import type Logger from '../../../../lib/Logger';
import ConsolidatedEventHandler from '../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import type { Events } from '../../../../lib/wallet/ethereum/contracts/ContractEventHandler';
import type { EthereumSetup } from '../EthereumTools';
import { fundSignerWallet, getSigner } from '../EthereumTools';

type BlockListener = (block: { number: number }) => void;

describe('ConsolidatedEventHandler integration', () => {
  let setup: EthereumSetup;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const mockNetworkDetails = { name: 'Anvil' } as any;

  const createConsolidated = (requiredConfirmations: number) => {
    const { provider, mineAndNotify } = createProvider();
    const consolidated = new ConsolidatedEventHandler(
      mockLogger,
      mockNetworkDetails,
      provider as any,
      requiredConfirmations,
    );

    return {
      consolidated,
      mineAndNotify,
      destroy: () => consolidated.destroy(),
    };
  };

  const createProvider = () => {
    let blockListener: BlockListener | undefined;

    const provider = {
      getBlockNumber: () => setup.provider.getBlockNumber(),
      getTransactionReceipt: (hash: string) =>
        setup.provider.getTransactionReceipt(hash),
      onBlock: async (listener: BlockListener) => {
        blockListener = listener;
        return provider;
      },
    };

    const mineAndNotify = async () => {
      await setup.provider.send('evm_mine', []);
      const blockNumber = await setup.provider.getBlockNumber();
      blockListener?.({ number: blockNumber });
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
    };

    return { provider, mineAndNotify };
  };

  const sendTransaction = async (): Promise<TransactionResponse> => {
    const tx = await setup.etherBase.sendTransaction({
      to: await setup.signer.getAddress(),
      value: 1n,
    });
    await tx.wait(1);
    return tx;
  };

  const etherSwapValues = () => ({
    preimageHash: Buffer.alloc(32),
    amount: 1n,
    claimAddress: '0xclaim',
    refundAddress: '0xrefund',
    timelock: 100,
  });

  const erc20SwapValues = () => ({
    ...etherSwapValues(),
    tokenAddress: '0xtoken',
  });

  const ethLockupPayload = async (): Promise<Events['eth.lockup']> => {
    const transaction = await sendTransaction();

    return {
      version: 4n,
      transaction,
      etherSwapValues: etherSwapValues(),
    };
  };

  const erc20LockupPayload = async (): Promise<Events['erc20.lockup']> => {
    const transaction = await sendTransaction();

    return {
      version: 4n,
      transaction,
      erc20SwapValues: erc20SwapValues(),
    };
  };

  const claimPayload = (
    eventName: 'eth.claim' | 'erc20.claim',
  ): Events['eth.claim'] | Events['erc20.claim'] => ({
    version: 4n,
    transactionHash: eventName === 'eth.claim' ? '0xabc' : '0xdef',
    preimageHash: Buffer.alloc(32),
    preimage: Buffer.alloc(32),
  });

  const mineAndAssertEmission = async (
    mineAndNotify: () => Promise<void>,
    emitted: jest.Mock,
    blocksUntilEmission: number,
  ) => {
    for (let mined = 1; mined < blocksUntilEmission; mined += 1) {
      await mineAndNotify();
      expect(emitted).not.toHaveBeenCalled();
    }

    await mineAndNotify();
    expect(emitted).toHaveBeenCalledTimes(1);
  };

  beforeAll(async () => {
    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
  });

  afterAll(() => {
    setup.provider.destroy();
  });

  test.each([
    {
      eventName: 'eth.lockup' as const,
      requiredConfirmations: 3,
      blocksUntilEmission: 2,
    },
    {
      eventName: 'erc20.lockup' as const,
      requiredConfirmations: 2,
      blocksUntilEmission: 1,
    },
  ])(
    '$eventName waits for confirmations then forwards',
    async ({ eventName, requiredConfirmations, blocksUntilEmission }) => {
      const { consolidated, mineAndNotify, destroy } = createConsolidated(
        requiredConfirmations,
      );
      const emitted = jest.fn();
      consolidated.on(eventName, emitted);

      if (eventName === 'eth.lockup') {
        await consolidated.handleEvent('eth.lockup', await ethLockupPayload());
      } else {
        await consolidated.handleEvent(
          'erc20.lockup',
          await erc20LockupPayload(),
        );
      }

      expect(emitted).not.toHaveBeenCalled();
      await mineAndAssertEmission(mineAndNotify, emitted, blocksUntilEmission);

      destroy();
    },
  );

  test('forwards immediately when confirmations is 1', async () => {
    const { consolidated, destroy } = createConsolidated(1);
    const emitted = jest.fn();
    consolidated.on('eth.lockup', emitted);

    await consolidated.handleEvent('eth.lockup', await ethLockupPayload());

    expect(emitted).toHaveBeenCalledTimes(1);

    destroy();
  });

  test.each(['eth.claim', 'erc20.claim'] as const)(
    '%s forwards immediately',
    async (eventName) => {
      const { consolidated, destroy } = createConsolidated(10);
      const emitted = jest.fn();
      consolidated.on(eventName, emitted);

      await consolidated.handleEvent(eventName, claimPayload(eventName));

      expect(emitted).toHaveBeenCalledTimes(1);

      destroy();
    },
  );

  test('drops lockup event with null transaction hash', async () => {
    const { consolidated, mineAndNotify, destroy } = createConsolidated(2);

    const emitted = jest.fn();
    consolidated.on('eth.lockup', emitted);

    await consolidated.handleEvent('eth.lockup', {
      version: 4n,
      transaction: { hash: null } as any,
      etherSwapValues: etherSwapValues(),
    } as Events['eth.lockup']);

    await mineAndNotify();
    await mineAndNotify();

    expect(emitted).not.toHaveBeenCalled();

    destroy();
  });
});
