import ElementsClient from '../../../../../lib/chain/ElementsClient';
import {
  CurrencyType,
  SwapType,
  swapTypeToPrettyString,
} from '../../../../../lib/consts/Enums';
import ExpiryTrigger from '../../../../../lib/service/cooperative/triggers/ExpiryTrigger';

describe('ExpiryTrigger', () => {
  const tolerance = 60;
  let trigger: ExpiryTrigger;

  const currencies = new Map<string, any>([
    [
      'BTC',
      {
        type: CurrencyType.BitcoinLike,
        chainClient: {
          getBlockchainInfo: async () => ({
            blocks: 100,
          }),
        },
      },
    ],
    [
      ElementsClient.symbol,
      {
        type: CurrencyType.Liquid,
        chainClient: {
          getBlockchainInfo: async () => ({
            blocks: 121,
          }),
        },
      },
    ],
    [
      'RBTC',
      {
        type: CurrencyType.Ether,
        provider: {
          getBlockNumber: async () => 1_021,
        },
      },
    ],
    [
      'USDT',
      {
        type: CurrencyType.ERC20,
        provider: {
          getBlockNumber: async () => 1_022,
        },
      },
    ],
  ]);

  beforeEach(() => {
    trigger = new ExpiryTrigger(currencies, tolerance);
  });

  describe('check', () => {
    describe.each`
      name | fn
      ${swapTypeToPrettyString(SwapType.Submarine)} | ${(height: number) => ({
  type: SwapType.Submarine,
  timeoutBlockHeight: height,
})}
      ${swapTypeToPrettyString(SwapType.Chain)} | ${(height: number) => ({
  type: SwapType.Chain,
  receivingData: {
    timeoutBlockHeight: height,
  },
})}
    `('$name', ({ fn }) => {
      test.each([100, 101, 102, 106])(
        'should return true if the block height is less than or equal to the tolerance',
        async (blockHeight) => {
          await expect(trigger.check('BTC', fn(blockHeight))).resolves.toEqual(
            true,
          );
        },
      );

      test.each([107, 108, 10_000])(
        'should return false if the block height is greater than the tolerance',
        async (blockHeight) => {
          await expect(trigger.check('BTC', fn(blockHeight))).resolves.toEqual(
            false,
          );
        },
      );
    });
  });

  describe('getBlockHeight', () => {
    test.each`
      symbol                   | height
      ${'BTC'}                 | ${100}
      ${ElementsClient.symbol} | ${121}
    `(
      'should return the block height of UTXO based chain $symbol',
      async ({ symbol, height }) => {
        const blockHeight = await trigger['getBlockHeight'](symbol);
        expect(blockHeight).toBeDefined();
        expect(blockHeight).toEqual(height);
      },
    );

    test.each`
      symbol    | height
      ${'RBTC'} | ${1_021}
      ${'USDT'} | ${1_022}
    `(
      'should return the block height of EVM based chain $symbol',
      async ({ symbol, height }) => {
        const blockHeight = await trigger['getBlockHeight'](symbol);
        expect(blockHeight).toBeDefined();
        expect(blockHeight).toEqual(height);
      },
    );

    test('should throw an error if the currency is not found', async () => {
      await expect(trigger['getBlockHeight']('DOGE')).rejects.toThrow(
        'currency DOGE not found',
      );
    });
  });
});
