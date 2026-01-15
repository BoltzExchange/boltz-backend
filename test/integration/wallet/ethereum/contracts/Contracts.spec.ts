import Logger from '../../../../../lib/Logger';
import Errors from '../../../../../lib/wallet/Errors';
import type ConsolidatedEventHandler from '../../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import type InjectedProvider from '../../../../../lib/wallet/ethereum/InjectedProvider';
import Contracts, {
  Feature,
} from '../../../../../lib/wallet/ethereum/contracts/Contracts';
import type { EthereumSetup } from '../../EthereumTools';
import { getContracts, getSigner } from '../../EthereumTools';

describe('Contracts', () => {
  let setup: EthereumSetup;
  let setupContracts: Awaited<ReturnType<typeof getContracts>>;

  let contracts: Contracts;

  beforeAll(async () => {
    setup = await getSigner();
    setupContracts = await getContracts(setup.signer);
  });

  afterAll(() => {
    setup.provider.removeAllListeners();

    setup.provider.destroy();
  });

  describe('init', () => {
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

  describe('decodeClaimData', () => {
    test.each`
      data
      ${''}
      ${'0x'}
      ${'0x00'}
      ${'0x0899146b2f6dfd78f850ab2311240af43c4081966737e81225d5d2add7586e5f1fbd07940000000000000000000000001bdf482f5da32ef51c20d9a94960385c5be9aab700000000000000000000000000000000000000000000000000000000006f2a09'}
    `('should return empty array for unknown data: $data', ({ data }) => {
      expect(contracts.decodeClaimData(true, data)).toEqual([]);
    });

    describe('EtherSwap', () => {
      test('should decode Ether batch claims', () => {
        const res = contracts.decodeClaimData(
          true,
          '0xc2c3a8c90000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000004b83f443c31e99ef7180edcc2f9f7454b25572e57da054be58421f77aabf08ee778a6c9a32078afa8e59e7e69bccbff6de0232dd21d3e1a6c00addaaea87b772ce82d686340cebc45b909803de9b07067dadfae822fae3b10b31e602023dd593652407e4d3438bb6a6e58594deda5af606c9e49b3fb5a7d6726252994870212210000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000001550f7dca700000000000000000000000000000000000000000000000000000000dace6570a8000000000000000000000000000000000000000000000000000001116be05bdc00000000000000000000000000000000000000000000000000000148095b471000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000001c7531ec1de19e859c4f0dd160760f0aef2e6e3000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000006f821900000000000000000000000000000000000000000000000000000000006f82c300000000000000000000000000000000000000000000000000000000006f82d100000000000000000000000000000000000000000000000000000000006f82d9',
        );
        expect(res).toEqual([
          {
            preimage:
              '0xb83f443c31e99ef7180edcc2f9f7454b25572e57da054be58421f77aabf08ee7',
            amount: 6000000000000000n,
          },
          {
            preimage:
              '0x78a6c9a32078afa8e59e7e69bccbff6de0232dd21d3e1a6c00addaaea87b772c',
            amount: 240580000000000n,
          },
          {
            preimage:
              '0xe82d686340cebc45b909803de9b07067dadfae822fae3b10b31e602023dd5936',
            amount: 300630000000000n,
          },
          {
            preimage:
              '0x52407e4d3438bb6a6e58594deda5af606c9e49b3fb5a7d672625299487021221',
            amount: 360680000000000n,
          },
        ]);
      });

      test('should decode Ether claims', () => {
        const res = contracts.decodeClaimData(
          true,
          '0xc3c37fbcf964239e31068f2b97f953c4944dc6ebd55d676d7ec33fcb3e48c17311f2961d00000000000000000000000000000000000000000000000000013ca8a52be4000000000000000000000000001bdf482f5da32ef51c20d9a94960385c5be9aab700000000000000000000000000000000000000000000000000000000006f43dd',
        );
        expect(res).toEqual([
          {
            preimage:
              '0xf964239e31068f2b97f953c4944dc6ebd55d676d7ec33fcb3e48c17311f2961d',
            amount: 348170000000000n,
          },
        ]);
      });

      test('should decode Ether claims for address', () => {
        const res = contracts.decodeClaimData(
          true,
          '0xcd413efaec403faf0719b8b1ad469c28f9ec02fb3f1093d61f9cbfd601e5f5fcce42f4430000000000000000000000000000000000000000000000000162de6efb551c00000000000000000000000000004ca129c71da487afd603bb123b12398a3c5a230000000000000000000000001bdf482f5da32ef51c20d9a94960385c5be9aab700000000000000000000000000000000000000000000000000000000006f3a3d',
        );
        expect(res).toEqual([
          {
            preimage:
              '0xec403faf0719b8b1ad469c28f9ec02fb3f1093d61f9cbfd601e5f5fcce42f443',
            amount: 99886710000000000n,
          },
        ]);
      });
    });

    describe('ERC20Swap', () => {
      test('should decode ERC20 batch claims', () => {
        const res = contracts.decodeClaimData(
          false,
          '0x8579dc5f0000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000020d8e03b18ab3b707eebc781f0839f0549badad4849b156f4fe5f974cc71b54650a78f494e5c885273426b0aef86a74fbcd27d935b1b4dfdeca76b77b9ae43bc0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000200b350000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003',
        );
        expect(res).toEqual([
          {
            preimage:
              '0x0d8e03b18ab3b707eebc781f0839f0549badad4849b156f4fe5f974cc71b5465',
            amount: 1n,
            token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
          },
          {
            preimage:
              '0x0a78f494e5c885273426b0aef86a74fbcd27d935b1b4dfdeca76b77b9ae43bc0',
            amount: 2100021n,
            token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
          },
        ]);
      });

      test('should decode ERC20 claims', () => {
        const res = contracts.decodeClaimData(
          false,
          '0xcd413efa4842eef66346722b61b7bfc2846f8ea655338ef4ae90c50c26f359447f7889f500000000000000000000000000000000000000000000000000000000000000010000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000002',
        );
        expect(res).toEqual([
          {
            preimage:
              '0x4842eef66346722b61b7bfc2846f8ea655338ef4ae90c50c26f359447f7889f5',
            amount: 1n,
            token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
          },
        ]);
      });

      test('should decode ERC20 claims for address', () => {
        const res = contracts.decodeClaimData(
          false,
          '0xbc586b283c599ecbe097d4b9f7bcc78c58da9972ea553aa28b11a9389c323eeb7f5cf22900000000000000000000000000000000000000000000000000000000000000010000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000002',
        );
        expect(res).toEqual([
          {
            preimage:
              '0x3c599ecbe097d4b9f7bcc78c58da9972ea553aa28b11a9389c323eeb7f5cf229',
            amount: 1n,
            token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
          },
        ]);
      });
    });
  });
});
