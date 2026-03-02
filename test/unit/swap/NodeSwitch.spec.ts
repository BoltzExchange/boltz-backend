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
    id: string,
    connected: boolean = true,
  ): LightningClient =>
    ({
      id,
      type,
      serviceName: () => service,
      isConnected: () => connected,
    }) as LightningClient;

  const clnClient = createNode(
    ClnClient.serviceName,
    NodeType.CLN,
    'cln-1',
  ) as LndClient;
  const lndClient = createNode(
    LndClient.serviceName,
    NodeType.LND,
    'lnd-1',
  ) as ClnClient;

  const lndOnlyCurrency = {
    clnClient: undefined,
    lndClients: new Map([[lndClient.id, lndClient]]),
  } as unknown as Currency;

  const clnOnlyCurrency = {
    clnClient,
    lndClients: new Map(),
  } as unknown as Currency;

  let currency = {
    clnClient,
    lndClients: new Map([[lndClient.id, lndClient]]),
  } as unknown as Currency;

  beforeEach(() => {
    currency = {
      clnClient,
      lndClients: new Map([[lndClient.id, lndClient]]),
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
        swapNode: lndClient.id,
        referralsIds: {
          test: clnClient.id,
          breez: lndClient.id,
          other: 123,
        },
        preferredForNode: {
          [nodeOne]: lndClient.id,
          [nodeTwo]: clnClient.id,
          unparseable: 123,
        },
      } as any;
      const ns = new NodeSwitch(Logger.disabledLogger, config);

      expect(ns['clnAmountThreshold']).toEqual({
        [SwapType.Submarine]: config.clnAmountThreshold,
        [SwapType.ReverseSubmarine]: config.clnAmountThreshold,
      });
      expect(ns['swapNode']).toEqual(lndClient.id);

      const referrals = ns['referralIds'];
      expect(referrals.size).toEqual(2);
      expect(referrals.get('test')).toEqual(clnClient.id);
      expect(referrals.get('breez')).toEqual(lndClient.id);

      const preferredNodes = ns['preferredForNode'];
      expect(preferredNodes.size).toEqual(2);
      expect(preferredNodes.get(nodeOne)).toEqual(lndClient.id);
      expect(preferredNodes.get(nodeTwo.toLowerCase())).toEqual(clnClient.id);
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
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${clnOnlyCurrency}
    ${1}         | ${undefined} | ${lndClient} | ${lndOnlyCurrency}
    ${2_000_000} | ${undefined} | ${clnClient} | ${clnOnlyCurrency}
  `(
    'should get node for Swap of amount $amount and referral id $referral',
    async ({ amount, client, currency, referral }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: lndClient.id },
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
    swapNode        | currency           | expected
    ${lndClient.id} | ${currency}        | ${lndClient}
    ${clnClient.id} | ${currency}        | ${clnClient}
    ${lndClient.id} | ${clnOnlyCurrency} | ${clnClient}
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
      hookResult                                       | testCurrency       | expected                                      | description
      ${{ nodeId: lndClient.id }}                      | ${currency}        | ${{ client: lndClient }}                      | ${'LND by nodeId'}
      ${{ nodeId: lndClient.id, timePreference: 0.5 }} | ${currency}        | ${{ client: lndClient, timePreference: 0.5 }} | ${'LND by nodeId with time preference'}
      ${{ nodeId: clnClient.id }}                      | ${currency}        | ${{ client: clnClient }}                      | ${'CLN by nodeId'}
      ${undefined}                                     | ${currency}        | ${undefined}                                  | ${'undefined when hook returns undefined'}
      ${{ nodeId: lndClient.id }}                      | ${clnOnlyCurrency} | ${undefined}                                  | ${'undefined when hook returns LND but LND client is missing'}
      ${{ nodeId: clnClient.id }}                      | ${lndOnlyCurrency} | ${undefined}                                  | ${'undefined when hook returns CLN but CLN client is missing'}
      ${{ timePreference: -1 }}                        | ${currency}        | ${{ timePreference: -1 }}                     | ${'time preference only without client'}
      ${{ nodeId: lndClient.id, timePreference: 0.5 }} | ${clnOnlyCurrency} | ${{ timePreference: 0.5 }}                    | ${'time preference only when requested client missing'}
    `(
      'should return $description',
      async ({ hookResult, testCurrency, expected }) => {
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
        ).resolves.toEqual(expected);

        expect(hook).toHaveBeenCalledTimes(1);
        expect(hook).toHaveBeenCalledWith(swap.id, swap.invoice, decoded);
      },
    );
  });

  describe('xpay handling', () => {
    afterAll(() => {
      LightningPaymentRepository.findByPreimageHashAndNodeId = jest
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

        LightningPaymentRepository.findByPreimageHashAndNodeId = jest
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
          LightningPaymentRepository.findByPreimageHashAndNodeId,
        ).toHaveBeenCalledTimes(1);
        expect(
          LightningPaymentRepository.findByPreimageHashAndNodeId,
        ).toHaveBeenCalledWith(
          getHexString(decoded.paymentHash!),
          clnClient.id,
        );
      },
    );

    test('should prefer a connected LND when max xpay retries are reached', async () => {
      const disconnectedLnd = createNode(
        LndClient.serviceName,
        NodeType.LND,
        'lnd-down',
        false,
      );
      const connectedLnd = createNode(
        LndClient.serviceName,
        NodeType.LND,
        'lnd-2',
      );
      const multiLndCurrency = {
        clnClient,
        lndClients: new Map([
          [disconnectedLnd.id, disconnectedLnd],
          [connectedLnd.id, connectedLnd],
        ]),
      } as unknown as Currency;
      const decoded = {
        type: InvoiceType.Bolt11,
        paymentHash: randomBytes(32),
        amountMsat: satToMsat(21_000),
        routingHints: [],
      } as unknown as DecodedInvoice;

      LightningPaymentRepository.findByPreimageHashAndNodeId = jest
        .fn()
        .mockResolvedValue({
          retries: NodeSwitch['maxClnRetries'],
        } as LightningPayment);

      await expect(
        new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
          multiLndCurrency,
          decoded,
          {},
        ),
      ).resolves.toEqual(connectedLnd);

      expect(
        LightningPaymentRepository.findByPreimageHashAndNodeId,
      ).toHaveBeenCalledWith(getHexString(decoded.paymentHash!), clnClient.id);
    });

    test('should fall back when no connected LND is available after max xpay retries', async () => {
      const disconnectedLnd = createNode(
        LndClient.serviceName,
        NodeType.LND,
        'lnd-down',
        false,
      );
      const noConnectedLndCurrency = {
        clnClient,
        lndClients: new Map([[disconnectedLnd.id, disconnectedLnd]]),
      } as unknown as Currency;
      const decoded = {
        type: InvoiceType.Bolt11,
        paymentHash: randomBytes(32),
        amountMsat: satToMsat(21_000),
        routingHints: [],
      } as unknown as DecodedInvoice;

      LightningPaymentRepository.findByPreimageHashAndNodeId = jest
        .fn()
        .mockResolvedValue({
          retries: NodeSwitch['maxClnRetries'],
        } as LightningPayment);

      await expect(
        new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
          noConnectedLndCurrency,
          decoded,
          {},
        ),
      ).resolves.toEqual(clnClient);

      expect(
        LightningPaymentRepository.findByPreimageHashAndNodeId,
      ).toHaveBeenCalledWith(getHexString(decoded.paymentHash!), clnClient.id);
    });
  });

  test.each`
    nodeId     | node
    ${'lnd-1'} | ${lndClient}
    ${'cln-1'} | ${clnClient}
  `('should get node for nodeId $nodeId', ({ nodeId, node }) => {
    expect(
      NodeSwitch.getReverseSwapNode(currency, {
        nodeId,
      } as ReverseSwap),
    ).toEqual({
      nodeId: node.id,
      nodeType: node.type,
      lightningClient: node,
    });
  });

  test('should throw when nodeId not found', () => {
    expect(() =>
      NodeSwitch.getReverseSwapNode(currency, {
        id: 'swap-123',
        nodeId: 'non-existent-node',
      } as ReverseSwap),
    ).toThrow(
      Errors.NO_AVAILABLE_LIGHTNING_CLIENT(
        'node non-existent-node not found for reverse swap swap-123',
      ).message,
    );
  });

  test('should throw when node is not connected', () => {
    const disconnectedClient = createNode(
      LndClient.serviceName,
      NodeType.LND,
      'lnd-disconnected',
      false,
    );
    const currencyWithDisconnected = {
      clnClient,
      lndClients: new Map([
        [lndClient.id, lndClient],
        [disconnectedClient.id, disconnectedClient],
      ]),
    } as unknown as Currency;

    expect(() =>
      NodeSwitch.getReverseSwapNode(currencyWithDisconnected, {
        id: 'swap-456',
        nodeId: 'lnd-disconnected',
      } as ReverseSwap),
    ).toThrow(
      Errors.NO_AVAILABLE_LIGHTNING_CLIENT(
        'node lnd-disconnected is not connected for reverse swap swap-456',
      ).message,
    );
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
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${NodeType.CLN} | ${clnOnlyCurrency}
    ${1}         | ${undefined} | ${lndClient} | ${NodeType.LND} | ${lndOnlyCurrency}
    ${2_000_000} | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${clnOnlyCurrency}
  `(
    'should get candidates for Reverse Swap for amount $amount and referral $referral',
    ({ amount, referral, client, type, currency }) => {
      const candidates = new NodeSwitch(Logger.disabledLogger, {
        referralsIds: { breez: lndClient.id },
        clnAmountThreshold: {
          submarine: 2_000_000,
          reverse: 1_000_000,
        },
      }).getReverseSwapCandidates(currency, amount, referral);

      expect(candidates[0]).toEqual({
        nodeType: type,
        nodeId: client.id,
        lightningClient: client,
      });
    },
  );

  test.each`
    currency                                                                      | expected
    ${{ lndClients: new Map(), clnClient: undefined }}                            | ${[]}
    ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: undefined }} | ${[lndClient]}
    ${{ lndClients: new Map(), clnClient: clnClient }}                            | ${[clnClient]}
    ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: clnClient }} | ${[lndClient, clnClient]}
  `('should get clients', ({ currency, expected }) => {
    expect(NodeSwitch.getClients(currency)).toEqual(expected);
  });

  test.each`
    has      | currency                                                                      | type
    ${true}  | ${currency}                                                                   | ${undefined}
    ${true}  | ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: undefined }} | ${undefined}
    ${true}  | ${{ lndClients: new Map(), clnClient: clnClient }}                            | ${undefined}
    ${false} | ${{ lndClients: new Map(), clnClient: undefined }}                            | ${undefined}
    ${true}  | ${currency}                                                                   | ${NodeType.LND}
    ${true}  | ${currency}                                                                   | ${NodeType.CLN}
    ${true}  | ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: undefined }} | ${NodeType.LND}
    ${false} | ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: undefined }} | ${NodeType.CLN}
    ${false} | ${{ lndClients: new Map(), clnClient: clnClient }}                            | ${NodeType.LND}
    ${true}  | ${{ lndClients: new Map(), clnClient: clnClient }}                            | ${NodeType.CLN}
    ${false} | ${{ lndClients: new Map(), clnClient: undefined }}                            | ${NodeType.LND}
    ${false} | ${{ lndClients: new Map(), clnClient: undefined }}                            | ${NodeType.CLN}
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
            [getHexString(payee)]: clnClient.id,
          },
        })['getPreferredNode']({
          payee,
          routingHints: [],
        } as unknown as DecodedInvoice),
      ).toEqual(clnClient.id);
    });

    test('should get preferred node for routing hint', () => {
      const nodeId = randomBytes(32);

      expect(
        new NodeSwitch(Logger.disabledLogger, {
          preferredForNode: {
            [getHexString(nodeId)]: clnClient.id,
          },
        })['getPreferredNode']({
          routingHints: [[{ nodeId: getHexString(nodeId) }]],
        } as unknown as DecodedInvoice),
      ).toEqual(clnClient.id);
    });

    test('should default to swapNode when no preference is configured', () => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          swapNode: lndClient.id,
        })['getPreferredNode']({
          payee: randomBytes(32),
          routingHints: [[{ nodeId: getHexString(randomBytes(32)) }]],
        } as unknown as DecodedInvoice),
      ).toEqual(lndClient.id);
    });
  });

  test.each`
    currency                                                                                                               | client       | expected
    ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: clnClient }}                                          | ${lndClient} | ${lndClient}
    ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: clnClient }}                                          | ${clnClient} | ${clnClient}
    ${{ lndClients: new Map([[lndClient.id, lndClient]]), clnClient: clnClient }}                                          | ${undefined} | ${lndClient}
    ${{ lndClients: new Map(), clnClient: clnClient }}                                                                     | ${lndClient} | ${lndClient}
    ${{ lndClients: new Map(), clnClient: clnClient }}                                                                     | ${undefined} | ${clnClient}
    ${{ lndClients: new Map([[lndClient.id, createNode('LND', NodeType.LND, 'lnd-down', false)]]), clnClient: clnClient }} | ${undefined} | ${clnClient}
    ${{ lndClients: new Map(), clnClient: undefined }}                                                                     | ${lndClient} | ${lndClient}
  `(
    'should fallback based on client availability',
    ({ currency, client, expected }) => {
      expect(NodeSwitch.fallback(currency, client)).toEqual(expected);
    },
  );

  test('should throw when no clients are available', () => {
    expect(() =>
      NodeSwitch.fallback({
        lndClients: new Map(),
        clnClient: undefined,
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
    expect(() =>
      NodeSwitch.fallback({
        lndClients: new Map([
          [lndClient.id, createNode('LND', NodeType.LND, lndClient.id, false)],
        ]),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
    expect(() =>
      NodeSwitch.fallback({
        lndClients: new Map([
          [lndClient.id, createNode('LND', NodeType.LND, lndClient.id, false)],
        ]),
        clnClient: createNode('CLN', NodeType.CLN, clnClient.id, false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
  });
});
