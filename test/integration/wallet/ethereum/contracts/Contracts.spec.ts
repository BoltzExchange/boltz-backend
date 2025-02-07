import Logger from '../../../../../lib/Logger';
import Errors from '../../../../../lib/wallet/Errors';
import ConsolidatedEventHandler from '../../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import InjectedProvider from '../../../../../lib/wallet/ethereum/InjectedProvider';
import Contracts, {
  Feature,
} from '../../../../../lib/wallet/ethereum/contracts/Contracts';
import { EthereumSetup, getContracts, getSigner } from '../../EthereumTools';

describe('Contracts', () => {
  let setup: EthereumSetup;
  let setupContracts: Awaited<ReturnType<typeof getContracts>>;

  beforeAll(async () => {
    setup = await getSigner();
    setupContracts = await getContracts(setup.signer);
  });

  afterAll(() => {
    setup.provider.removeAllListeners();

    setup.provider.destroy();
  });

  describe('init', () => {
    let contracts: Contracts;

    beforeEach(async () => {
      if (contracts !== undefined) {
        contracts.contractEventHandler.destroy();
      }

      contracts = new Contracts(
        Logger.disabledLogger,
        {
          name: 'RSK',
          symbol: 'RBTC',
          decimals: 18n,
        },
        {
          etherSwap: await setupContracts.etherSwap.getAddress(),
          erc20Swap: await setupContracts.erc20Swap.getAddress(),
        },
      );
    });

    test('should init', async () => {
      const eventHandler = {
        register: jest.fn(),
      } as unknown as ConsolidatedEventHandler;
      await contracts.init(
        setup.provider as unknown as InjectedProvider,
        setup.signer,
        eventHandler,
      );

      expect(contracts.version).toEqual(
        await setupContracts.etherSwap.version(),
      );
      expect(contracts.features).toEqual(new Set([Feature.BatchClaim]));

      expect(contracts.etherSwap).toBeDefined();
      expect(contracts.erc20Swap).toBeDefined();

      expect(eventHandler.register).toHaveBeenCalledTimes(1);
    });

    test('should throw for missing contracts', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      contracts['contracts'] = {
        etherSwap: undefined,
        erc20Swap: undefined,
      };
      await expect(
        contracts.init(
          setup.provider as unknown as InjectedProvider,
          setup.signer,
          {} as any,
        ),
      ).rejects.toEqual(Errors.MISSING_SWAP_CONTRACTS());
    });

    test('should throw when contract version is not supported', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      Contracts.maxVersion = -1n;

      await expect(
        contracts.init(
          setup.provider as unknown as InjectedProvider,
          setup.signer,
          {} as any,
        ),
      ).rejects.toEqual(
        Errors.INVALID_ETHEREUM_CONFIGURATION(
          `unsupported contract version ${await setupContracts.etherSwap.version()}`,
        ),
      );
    });
  });
});
