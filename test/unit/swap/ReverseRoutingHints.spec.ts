import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexBuffer, getHexString, getSwapMemo } from '../../../lib/Utils';
import { SwapType, SwapVersion } from '../../../lib/consts/Enums';
import type { DecodedInvoice } from '../../../lib/lightning/LightningClient';
import PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';
import Errors from '../../../lib/swap/Errors';
import ReverseRoutingHints from '../../../lib/swap/ReverseRoutingHints';
import type { Currency } from '../../../lib/wallet/WalletManager';

describe('ReverseRoutingHints', () => {
  const sendingCurrency = {
    symbol: 'BTC',
  } as Currency;

  const reverseMinerFees = 123;

  const paymentRequestUtils = new PaymentRequestUtils();
  const hints = new ReverseRoutingHints(
    {
      wallets: new Map<string, any>([
        [
          sendingCurrency.symbol,
          {
            decodeAddress: jest.fn().mockImplementation((address) => {
              if (address === 'invalid') {
                throw 'some decoding error';
              }

              return Buffer.alloc(0);
            }),
          },
        ],
      ]),
    } as any,
    {
      feeProvider: {
        minerFees: new Map<string, any>([
          [
            sendingCurrency.symbol,
            {
              [SwapVersion.Taproot]: {
                reverse: {
                  claim: reverseMinerFees,
                },
              },
            },
          ],
        ]),
      },
    } as any,
    paymentRequestUtils,
  );

  beforeAll(() => {
    jest.clearAllMocks();
  });

  describe('BOLT11', () => {
    test.each`
      descriptionHash
      ${undefined}
      ${getHexString(randomBytes(32))}
    `(
      'should get only invoice memo when no user address was specified with description hash: $descriptionHash',
      ({ descriptionHash }) => {
        expect(
          hints.getHints(sendingCurrency, {
            onchainAmount: 100_000,
            version: SwapVersion.Taproot,
            descriptionHash: descriptionHash
              ? getHexBuffer(descriptionHash)
              : undefined,
          }),
        ).toEqual({
          receivedAmount: 99877,
          invoiceDescriptionHash: descriptionHash
            ? getHexBuffer(descriptionHash)
            : undefined,
          invoiceMemo: getSwapMemo(
            sendingCurrency.symbol,
            SwapType.ReverseSubmarine,
          ),
        });
      },
    );

    test.each`
      descriptionHash
      ${undefined}
      ${getHexString(randomBytes(32))}
    `(
      'should also get BIP-21 and routing hint when address and signature are defined with description hash: $descriptionHash',
      ({ descriptionHash }) => {
        const amount = 100_000;
        const address =
          'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';
        const keys = ECPair.makeRandom();
        const signature = Buffer.from(
          keys.signSchnorr(crypto.sha256(Buffer.from(address, 'utf-8'))),
        );

        expect(
          hints.getHints(sendingCurrency, {
            userAddress: address,
            onchainAmount: amount,
            version: SwapVersion.Taproot,
            claimPublicKey: Buffer.from(keys.publicKey),
            userAddressSignature: signature,
            descriptionHash: descriptionHash
              ? getHexBuffer(descriptionHash)
              : undefined,
          }),
        ).toEqual({
          receivedAmount: 99877,
          invoiceDescriptionHash: descriptionHash
            ? getHexBuffer(descriptionHash)
            : undefined,
          invoiceMemo: getSwapMemo(
            sendingCurrency.symbol,
            SwapType.ReverseSubmarine,
          ),
          bip21: paymentRequestUtils.encodeBip21(
            sendingCurrency.symbol,
            address,
            amount - reverseMinerFees,
          ),
          routingHint: [
            [
              {
                nodeId: getHexString(Buffer.from(keys.publicKey)),
                chanId: ReverseRoutingHints['routingHintChanId'],
                feeBaseMsat: 0,
                cltvExpiryDelta: 81,
                feeProportionalMillionths: 21,
              },
            ],
          ],
        });
      },
    );

    describe('custom memo', () => {
      test('should pass through memo', () => {
        const memo = 'hello';

        expect(
          hints.getHints(sendingCurrency, {
            memo,
            onchainAmount: 100_000,
            version: SwapVersion.Taproot,
          }),
        ).toEqual({
          invoiceMemo: memo,
          receivedAmount: 99877,
        });
      });

      test('should handle empty string memo', () => {
        const memo = '';
        expect(
          hints.getHints(sendingCurrency, {
            memo,
            onchainAmount: 100_000,
            version: SwapVersion.Taproot,
          }),
        ).toEqual({
          invoiceMemo: memo,
          receivedAmount: 99877,
        });
      });

      test('should encode BIP-21 with custom memo', () => {
        const memo = 'custom text';
        const amount = 100_000;
        const address =
          'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';
        const keys = ECPair.makeRandom();
        const signature = Buffer.from(
          keys.signSchnorr(crypto.sha256(Buffer.from(address, 'utf-8'))),
        );

        expect(
          hints.getHints(sendingCurrency, {
            memo,
            userAddress: address,
            onchainAmount: amount,
            version: SwapVersion.Taproot,
            claimPublicKey: Buffer.from(keys.publicKey),
            userAddressSignature: signature,
          }),
        ).toEqual({
          invoiceMemo: memo,
          receivedAmount: 99877,
          bip21: paymentRequestUtils.encodeBip21(
            sendingCurrency.symbol,
            address,
            amount - reverseMinerFees,
            memo,
          ),
          routingHint: [
            [
              {
                nodeId: getHexString(Buffer.from(keys.publicKey)),
                chanId: ReverseRoutingHints['routingHintChanId'],
                feeBaseMsat: 0,
                cltvExpiryDelta: 81,
                feeProportionalMillionths: 21,
              },
            ],
          ],
        });
      });
    });

    test('should throw for invalid addresses', () => {
      const amount = 100_000;
      const address = 'invalid';
      const keys = ECPair.makeRandom();

      expect(() =>
        hints.getHints(sendingCurrency, {
          userAddress: address,
          onchainAmount: amount,
          version: SwapVersion.Taproot,
          claimPublicKey: Buffer.from(keys.publicKey),
          userAddressSignature: Buffer.alloc(1),
        }),
      ).toThrow(Errors.INVALID_ADDRESS().message);
    });

    test('should throw for invalid address signatures', () => {
      const amount = 100_000;
      const address =
        'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';
      const keys = ECPair.makeRandom();
      const signature = Buffer.from(
        keys.signSchnorr(
          crypto.sha256(Buffer.from('not the address', 'utf-8')),
        ),
      );

      expect(() =>
        hints.getHints(sendingCurrency, {
          userAddress: address,
          onchainAmount: amount,
          version: SwapVersion.Taproot,
          claimPublicKey: Buffer.from(keys.publicKey),
          userAddressSignature: signature,
        }),
      ).toThrow(Errors.INVALID_ADDRESS_SIGNATURE().message);
    });
  });

  describe('BOLT12', () => {
    const signingKeys = ECPair.makeRandom();
    const amount = 100_000;
    const address =
      'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';

    test('should add magic routing hint', () => {
      const signature = Buffer.from(
        signingKeys.signSchnorr(crypto.sha256(Buffer.from(address, 'utf-8'))),
      );

      const res = hints.getHints(sendingCurrency, {
        userAddress: address,
        onchainAmount: amount,
        version: SwapVersion.Taproot,
        userAddressSignature: signature,
        invoice: {
          decoded: {
            payee: signingKeys.publicKey,
            paths: [
              {
                shortChannelId: `${ReverseRoutingHints['routingHintChanId']}`,
              },
            ],
          } as Partial<DecodedInvoice> as any,
        },
      });

      expect(res).toEqual({
        bip21: paymentRequestUtils.encodeBip21(
          sendingCurrency.symbol,
          address,
          amount - reverseMinerFees,
        ),
        receivedAmount: amount - reverseMinerFees,
      });
    });

    test('should throw when magic routing hint is not preset', () => {
      expect(() =>
        hints.getHints(sendingCurrency, {
          userAddress: address,
          onchainAmount: amount,
          version: SwapVersion.Taproot,
          userAddressSignature: Buffer.alloc(1),
          invoice: {
            decoded: {
              payee: signingKeys.publicKey,
              paths: [],
            } as Partial<DecodedInvoice> as any,
          },
        }),
      ).toThrow(Errors.MAGIC_ROUTING_HINT_MISSING().message);
    });

    test('should throw for invalid address signatures', () => {
      const signature = Buffer.from(
        signingKeys.signSchnorr(
          crypto.sha256(Buffer.from('not the address', 'utf-8')),
        ),
      );

      expect(() =>
        hints.getHints(sendingCurrency, {
          userAddress: address,
          onchainAmount: amount,
          version: SwapVersion.Taproot,
          userAddressSignature: signature,
          invoice: {
            decoded: {
              payee: signingKeys.publicKey,
              paths: [
                {
                  shortChannelId: `${ReverseRoutingHints['routingHintChanId']}`,
                },
              ],
            } as Partial<DecodedInvoice> as any,
          },
        }),
      ).toThrow(Errors.INVALID_ADDRESS_SIGNATURE().message);
    });
  });

  test.each`
    length
    ${31}
    ${33}
    ${64}
  `(
    'should throw when checking description hash with length $length',
    ({ length }) => {
      expect(() => hints['checkDescriptionHash'](randomBytes(length))).toThrow(
        Errors.INVALID_DESCRIPTION_HASH().message,
      );
    },
  );
});
