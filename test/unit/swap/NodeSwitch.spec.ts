import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import { SwapType } from '../../../lib/consts/Enums';
import type LightningPayment from '../../../lib/db/models/LightningPayment';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type Swap from '../../../lib/db/models/Swap';
import LightningPaymentRepository from '../../../lib/db/repositories/LightningPaymentRepository';
import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import ClnClient from '../../../lib/lightning/cln/ClnClient';
import type DecodedInvoice from '../../../lib/sidecar/DecodedInvoice';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Errors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import type InvoicePaymentHook from '../../../lib/swap/hooks/InvoicePaymentHook';
import type { Currency } from '../../../lib/wallet/WalletManager';

describe('NodeSwitch', () => {
  const createNode = (
    service: string,
    type: NodeType,
    connected: boolean = true,
  ): LightningClient =>
    ({
      type,
      serviceName: () => service,
      isConnected: () => connected,
    }) as LightningClient;

  const clnClient = createNode(
    ClnClient.serviceName,
    NodeType.CLN,
  ) as LndClient;
  const lndClient = createNode(
    LndClient.serviceName,
    NodeType.LND,
  ) as ClnClient;

  let currency = {
    clnClient,
    lndClient,
  } as unknown as Currency;

  beforeEach(() => {
    currency = {
      clnClient,
      lndClient,
    } as unknown as Currency;
  });

  describe('constructor', () => {
    test.each`
      config
      ${undefined}
      ${{}}
    `('should handle empty config', ({ config }) => {
      const ns = new NodeSwitch(Logger.disabledLogger, config);
      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: NodeSwitch['defaultClnAmountThreshold'],
        [SwapType.ReverseSubmarine]: NodeSwitch['defaultClnAmountThreshold'],
      });
      expect(ns['referralIds'].size).toEqual(0);
    });

    test('should parse config with clnAmountThreshold as number', () => {
      const nodeOne =
        '026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2';
      const nodeTwo =
        '02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018'.toUpperCase();

      const config = {
        clnAmountThreshold: 21,
        swapNode: 'LND',
        referralsIds: {
          test: 'CLN',
          breez: 'LND',
          other: 'notFound',
        },
        preferredForNode: {
          [nodeOne]: 'LND',
          [nodeTwo]: 'CLN',
          unparseable: 'notFound',
        },
      };
      const ns = new NodeSwitch(Logger.disabledLogger, config);

      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: config.clnAmountThreshold,
        [SwapType.ReverseSubmarine]: config.clnAmountThreshold,
      });
      expect(ns['swapNode']).toEqual(NodeType.LND);

      const referrals = ns['referralIds'];
      expect(referrals.size).toEqual(2);
      expect(referrals.get('test')).toEqual(NodeType.CLN);
      expect(referrals.get('breez')).toEqual(NodeType.LND);

      const preferredNodes = ns['preferredForNode'];
      expect(preferredNodes.size).toEqual(2);
      expect(preferredNodes.get(nodeOne)).toEqual(NodeType.LND);
      expect(preferredNodes.get(nodeTwo.toLowerCase())).toEqual(NodeType.CLN);
    });

    test('should parse config with clnAmountThreshold as object', () => {
      const config = {
        clnAmountThreshold: {
          submarine: 2_000_000,
          reverse: 1_000_000,
        },
      };
      const ns = new NodeSwitch(Logger.disabledLogger, config);

      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: config.clnAmountThreshold.submarine,
        [SwapType.ReverseSubmarine]: config.clnAmountThreshold.reverse,
      });
    });

    test('should parse config with clnAmountThreshold as object and coalesce undefined', () => {
      const config = {
        clnAmountThreshold: {
          reverse: 1_000_000,
        },
      };
      const ns = new NodeSwitch(Logger.disabledLogger, config);

      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: NodeSwitch['defaultClnAmountThreshold'],
        [SwapType.ReverseSubmarine]: config.clnAmountThreshold.reverse,
      });
    });
  });

  test.each`
    amount       | referral     | client       | currency
    ${1}         | ${undefined} | ${clnClient} | ${currency}
    ${21}        | ${undefined} | ${clnClient} | ${currency}
    ${1_000}     | ${undefined} | ${clnClient} | ${currency}
    ${1_000_000} | ${undefined} | ${clnClient} | ${currency}
    ${1_000_001} | ${undefined} | ${lndClient} | ${currency}
    ${2_000_000} | ${undefined} | ${lndClient} | ${currency}
    ${1}         | ${'breez'}   | ${lndClient} | ${currency}
    ${1_000}     | ${'breez'}   | ${lndClient} | ${currency}
    ${1_000_000} | ${'breez'}   | ${lndClient} | ${currency}
    ${2_000_000} | ${'breez'}   | ${lndClient} | ${currency}
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${{ clnClient }}
    ${1}         | ${undefined} | ${lndClient} | ${{ lndClient }}
    ${2_000_000} | ${undefined} | ${clnClient} | ${{ clnClient }}
  `(
    'should get node for Swap of amount $amount and referral id $referral',
    async ({ amount, client, currency, referral }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: 'LND' },
          clnAmountThreshold: {
            submarine: 1_000_000,
            reverse: 2_000_000,
          },
        }).getSwapNode(
          currency,
          {
            type: InvoiceType.Bolt11,
            amountMsat: satToMsat(amount),
            routingHints: [],
          } as unknown as DecodedInvoice,
          {
            referral,
          } as Swap,
        ),
      ).resolves.toEqual(client);
    },
  );

  test.each`
    type                         | client
    ${InvoiceType.Bolt11}        | ${lndClient}
    ${InvoiceType.Bolt12Invoice} | ${clnClient}
  `(
    'should get node for Swap with invoice type $type',
    async ({ type, client }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
          currency,
          {
            type,
            amountMsat: satToMsat(1_000_001),
            routingHints: [],
          } as never as DecodedInvoice,
          {},
        ),
      ).resolves.toEqual(client);
    },
  );

  test.each`
    swapNode | currency         | expected
    ${'LND'} | ${currency}      | ${lndClient}
    ${'CLN'} | ${currency}      | ${clnClient}
    ${'LND'} | ${{ clnClient }} | ${clnClient}
  `(
    'should get node for Swap with swapNode $swapNode configured',
    async ({ swapNode, currency, expected }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {
          swapNode,
        }).getSwapNode(
          currency,
          {
            type: InvoiceType.Bolt11,
            routingHints: [],
          } as never as DecodedInvoice,
          {} as Swap,
        ),
      ).resolves.toEqual(expected);
    },
  );

  describe('invoicePaymentHook', () => {
    test.each`
      hookResult      | testCurrency     | expectedClient | description
      ${NodeType.LND} | ${currency}      | ${lndClient}   | ${'LND'}
      ${NodeType.CLN} | ${currency}      | ${clnClient}   | ${'CLN'}
      ${undefined}    | ${currency}      | ${undefined}   | ${'undefined when hook returns undefined'}
      ${NodeType.LND} | ${{ clnClient }} | ${undefined}   | ${'undefined when hook returns LND but LND client is missing'}
      ${NodeType.CLN} | ${{ lndClient }} | ${undefined}   | ${'undefined when hook returns CLN but CLN client is missing'}
    `(
      'should return $description',
      async ({ hookResult, testCurrency, expectedClient }) => {
        const ns = new NodeSwitch(Logger.disabledLogger, {});

        const hook = jest.fn().mockResolvedValue(hookResult);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        ns['paymentHook'] = {
          hook,
        } as unknown as InvoicePaymentHook;

        const swap = { id: 'testSwapId', invoice: 'lnbc...' };
        const decoded = {
          type: InvoiceType.Bolt11,
          paymentHash: randomBytes(32),
          amountMsat: satToMsat(1000),
          routingHints: [],
        } as unknown as DecodedInvoice;

        await expect(
          ns.invoicePaymentHook(testCurrency, swap, decoded),
        ).resolves.toEqual(expectedClient);

        expect(hook).toHaveBeenCalledTimes(1);
        expect(hook).toHaveBeenCalledWith(swap.id, swap.invoice, decoded);
      },
    );
  });

  describe('xpay handling', () => {
    afterAll(() => {
      LightningPaymentRepository.findByPreimageHashAndNode = jest
        .fn()
        .mockResolvedValue(null);
    });

    test.each`
      retries                            | expected
      ${null}                            | ${clnClient}
      ${undefined}                       | ${clnClient}
      ${0}                               | ${clnClient}
      ${NodeSwitch['maxClnRetries'] - 1} | ${clnClient}
      ${NodeSwitch['maxClnRetries']}     | ${lndClient}
      ${NodeSwitch['maxClnRetries'] + 1} | ${lndClient}
      ${1}                               | ${lndClient}
      ${2}                               | ${lndClient}
      ${3}                               | ${lndClient}
    `(
      'should fallback to LND when xpay max retries are reached',
      async ({ retries, expected }) => {
        const decoded = {
          type: InvoiceType.Bolt11,
          paymentHash: randomBytes(32),
          amountMsat: satToMsat(21_000),
          routingHints: [],
        } as unknown as DecodedInvoice;

        LightningPaymentRepository.findByPreimageHashAndNode = jest
          .fn()
          .mockResolvedValue({ retries } as LightningPayment);

        await expect(
          new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
            currency,
            decoded,
            {},
          ),
        ).resolves.toEqual(expected);

        expect(
          LightningPaymentRepository.findByPreimageHashAndNode,
        ).toHaveBeenCalledTimes(1);
        expect(
          LightningPaymentRepository.findByPreimageHashAndNode,
        ).toHaveBeenCalledWith(
          getHexString(decoded.paymentHash!),
          NodeType.CLN,
        );
      },
    );
  });

  test.each`
    type            | node
    ${NodeType.LND} | ${lndClient}
    ${NodeType.CLN} | ${clnClient}
    ${21}           | ${clnClient}
  `('should get node for NodeType $type', ({ type, node }) => {
    expect(
      NodeSwitch.getReverseSwapNode(currency, {
        node: type,
      } as ReverseSwap),
    ).toEqual(node);
  });

  test.each`
    amount       | referral     | client       | type            | currency
    ${1}         | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${21}        | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000}     | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_000} | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_001} | ${undefined} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${undefined} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${1}         | ${'breez'}   | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${'breez'}   | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${NodeType.CLN} | ${{ clnClient }}
    ${1}         | ${undefined} | ${lndClient} | ${NodeType.LND} | ${{ lndClient }}
    ${2_000_000} | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${{ clnClient }}
  `(
    'should get node for Reverse Swap for amount $amount and referral $referral',
    ({ amount, referral, client, type, currency }) => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: 'LND' },
          clnAmountThreshold: {
            submarine: 2_000_000,
            reverse: 1_000_000,
          },
        }).getNodeForReverseSwap('', currency, amount, referral),
      ).toEqual({ nodeType: type, lightningClient: client });
    },
  );

  test.each`
    has      | currency         | type
    ${true}  | ${currency}      | ${undefined}
    ${true}  | ${{ lndClient }} | ${undefined}
    ${true}  | ${{ clnClient }} | ${undefined}
    ${false} | ${{}}            | ${undefined}
    ${true}  | ${currency}      | ${NodeType.LND}
    ${true}  | ${currency}      | ${NodeType.CLN}
    ${true}  | ${{ lndClient }} | ${NodeType.LND}
    ${false} | ${{ lndClient }} | ${NodeType.CLN}
    ${false} | ${{ clnClient }} | ${NodeType.LND}
    ${true}  | ${{ clnClient }} | ${NodeType.CLN}
    ${false} | ${{}}            | ${NodeType.LND}
    ${false} | ${{}}            | ${NodeType.CLN}
  `('should check if currency has clients', ({ has, currency, type }) => {
    expect(NodeSwitch.hasClient(currency, type)).toEqual(has);
  });

  describe('updateClnThresholds', () => {
    test('should update CLN thresholds', () => {
      const ns = new NodeSwitch(Logger.disabledLogger, {});

      const threshold = 123;
      ns.updateClnThresholds([
        {
          type: SwapType.Submarine,
          threshold,
        },
      ]);

      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: threshold,
        [SwapType.ReverseSubmarine]: 1_000_000,
      });
    });

    test('should throw if swap type is invalid', () => {
      const ns = new NodeSwitch(Logger.disabledLogger, {});

      expect(() =>
        ns.updateClnThresholds([
          {
            type: SwapType.Chain,
            threshold: 123,
          },
        ]),
      ).toThrow('cannot be set for chain swaps');
    });
  });

  describe('getPreferredNode', () => {
    test('should get preferred node for payee', () => {
      const payee = randomBytes(32);

      expect(
        new NodeSwitch(Logger.disabledLogger, {
          preferredForNode: {
            [getHexString(payee)]: 'CLN',
          },
        })['getPreferredNode']({
          payee,
          routingHints: [],
        } as unknown as DecodedInvoice),
      ).toEqual(NodeType.CLN);
    });

    test('should get preferred node for routing hint', () => {
      const nodeId = randomBytes(32);

      expect(
        new NodeSwitch(Logger.disabledLogger, {
          preferredForNode: {
            [getHexString(nodeId)]: 'CLN',
          },
        })['getPreferredNode']({
          routingHints: [[{ nodeId: getHexString(nodeId) }]],
        } as unknown as DecodedInvoice),
      ).toEqual(NodeType.CLN);
    });

    test('should default to swapNode when no preference is configured', () => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          swapNode: 'LND',
        })['getPreferredNode']({
          payee: randomBytes(32),
          routingHints: [[{ nodeId: getHexString(randomBytes(32)) }]],
        } as unknown as DecodedInvoice),
      ).toEqual(NodeType.LND);
    });
  });

  test.each`
    currency                                                                       | client       | expected
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${lndClient} | ${lndClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${clnClient} | ${clnClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${undefined} | ${lndClient}
    ${{ clnClient: clnClient }}                                                    | ${lndClient} | ${lndClient}
    ${{ clnClient: clnClient }}                                                    | ${undefined} | ${clnClient}
    ${{ lndClient: createNode('LND', NodeType.LND, false), clnClient: clnClient }} | ${undefined} | ${clnClient}
    ${{}}                                                                          | ${lndClient} | ${lndClient}
  `(
    'should fallback based on client availability',
    ({ currency, client, expected }) => {
      expect(NodeSwitch.fallback(currency, client)).toEqual(expected);
    },
  );

  test('should throw when no clients are available', () => {
    expect(() => NodeSwitch.fallback({} as Currency)).toThrow(
      Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message,
    );
    expect(() =>
      NodeSwitch.fallback({
        lndClient: createNode('LND', NodeType.LND, false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
    expect(() =>
      NodeSwitch.fallback({
        lndClient: createNode('LND', NodeType.LND, false),
        clnClient: createNode('CLN', NodeType.CLN, false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
  });
});
