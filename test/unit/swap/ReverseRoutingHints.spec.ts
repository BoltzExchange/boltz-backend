import { crypto } from 'bitcoinjs-lib';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexString, getSwapMemo } from '../../../lib/Utils';
import { SwapType, SwapVersion } from '../../../lib/consts/Enums';
import PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';
import Errors from '../../../lib/swap/Errors';
import ReverseRoutingHints from '../../../lib/swap/ReverseRoutingHints';
import { Currency } from '../../../lib/wallet/WalletManager';

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

  test('should get only invoice memo when no user address was specified', () => {
    expect(
      hints.getHints(sendingCurrency, {
        onchainAmount: 100_000,
        version: SwapVersion.Taproot,
      }),
    ).toEqual({
      receivedAmount: 99876,
      invoiceMemo: getSwapMemo(
        sendingCurrency.symbol,
        SwapType.ReverseSubmarine,
      ),
    });
  });

  test('should also get BIP-21 and routing hint when address and signature are defined', () => {
    const amount = 100_000;
    const address =
      'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';
    const keys = ECPair.makeRandom();
    const signature = keys.signSchnorr(
      crypto.sha256(Buffer.from(address, 'utf-8')),
    );

    expect(
      hints.getHints(sendingCurrency, {
        userAddress: address,
        onchainAmount: amount,
        version: SwapVersion.Taproot,
        claimPublicKey: keys.publicKey,
        userAddressSignature: signature,
      }),
    ).toEqual({
      receivedAmount: 99876,
      invoiceMemo: getSwapMemo(
        sendingCurrency.symbol,
        SwapType.ReverseSubmarine,
      ),
      bip21: paymentRequestUtils.encodeBip21(
        sendingCurrency.symbol,
        address,
        amount - reverseMinerFees - 1,
      ),
      routingHint: [
        [
          {
            nodeId: getHexString(keys.publicKey),
            chanId: ReverseRoutingHints['routingHintChanId'],
            feeBaseMsat: 0,
            cltvExpiryDelta: 81,
            feeProportionalMillionths: 21,
          },
        ],
      ],
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
        claimPublicKey: keys.publicKey,
        userAddressSignature: Buffer.alloc(1),
      }),
    ).toThrow(Errors.INVALID_ADDRESS().message);
  });

  test('should throw for invalid address signatures', () => {
    const amount = 100_000;
    const address =
      'bcrt1pq6cwjynamw58jvwyg7lt2m62mqhq07kjuulz0an8wgjf9wufx3nsje7hve';
    const keys = ECPair.makeRandom();
    const signature = keys.signSchnorr(
      crypto.sha256(Buffer.from('not the address', 'utf-8')),
    );

    expect(() =>
      hints.getHints(sendingCurrency, {
        userAddress: address,
        onchainAmount: amount,
        version: SwapVersion.Taproot,
        claimPublicKey: keys.publicKey,
        userAddressSignature: signature,
      }),
    ).toThrow(Errors.INVALID_ADDRESS_SIGNATURE().message);
  });
});
