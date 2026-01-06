import { Transaction as ScureTransaction } from '@scure/btc-signer';
import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import ArkClient from '../../../../lib/chain/ArkClient';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import type LndClient from '../../../../lib/lightning/LndClient';
import type ClnClient from '../../../../lib/lightning/cln/ClnClient';
import Errors from '../../../../lib/service/Errors';
import MusigSigner, {
  RefundRejectionReason,
} from '../../../../lib/service/cooperative/MusigSigner';
import type SwapNursery from '../../../../lib/swap/SwapNursery';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import type { Currency } from '../../../../lib/wallet/WalletManager';

describe('MusigSigner', () => {
  const btcCurrency = {
    lndClient: {} as unknown as LndClient,
    clnClient: {} as unknown as ClnClient,
  };

  const arkCurrency = {
    symbol: ArkClient.symbol,
    type: CurrencyType.Ark,
    arkNode: {
      signTransaction: jest.fn(),
    },
  };

  const currencies = new Map<string, Currency>([
    ['BTC', btcCurrency as Currency],
    [ArkClient.symbol, arkCurrency as unknown as Currency],
  ]);

  const signer = new MusigSigner(
    Logger.disabledLogger,
    currencies,
    {} as unknown as WalletManager,
    {} as unknown as SwapNursery,
  );

  describe('signRefundArk', () => {
    test.each([[null], [undefined]])(
      'should throw when swap cannot be found (%s)',
      async (swap) => {
        SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

        const id = 'notFound';
        await expect(
          signer.signRefundArk(id, 'transaction', 'checkpoint'),
        ).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));

        expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
        expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id });
      },
    );

    test('should throw when currency is not Ark', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        chainCurrency: 'BTC',
      });

      const id = 'notArk';
      await expect(
        signer.signRefundArk(id, 'transaction', 'checkpoint'),
      ).rejects.toEqual(new Error('currency is not Ark'));

      expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id });
    });

    test('should throw when cooperative signatures are disabled', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        id: 'asdf',
        chainCurrency: 'ARK',
        version: SwapVersion.Taproot,
      });

      signer.setDisableCooperative(true);

      await expect(
        signer.signRefundArk('asdf', 'transaction', 'checkpoint'),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'cooperative signatures are disabled',
        ),
      );

      signer.setDisableCooperative(false);
    });

    test('should validate eligibility', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoicePending,
      });

      const id = 'eligible';
      await expect(
        signer.signRefundArk(id, 'transaction', 'checkpoint'),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          RefundRejectionReason.StatusNotEligible,
        ),
      );

      expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id });
    });

    test('should throw when checkpoint has more than one input', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: Buffer.alloc(32),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      checkpoint.addInput({
        txid: Buffer.alloc(32),
        index: 1,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);
      checkpoint['inputs'][1].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      await expect(
        signer.signRefundArk(
          'eligible',
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
        ),
      ).rejects.toEqual(new Error('checkpoint must have exactly one input'));
    });

    test('should throw when checkpoint input transaction id does not match lockup transaction id', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: randomBytes(32),
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      await expect(
        signer.signRefundArk(
          'eligible',
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
        ),
      ).rejects.toEqual(new Error('transaction is not for this swap'));
    });

    test('should throw when checkpoint input transaction vout does not match lockup transaction vout', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout - 2,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      await expect(
        signer.signRefundArk(
          'eligible',
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
        ),
      ).rejects.toEqual(new Error('transaction is not for this swap'));
    });

    test('should throw when refund transaction has more than one input', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 1,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);
      refundTx['inputs'][1].finalScriptSig = Buffer.alloc(64);

      await expect(
        signer.signRefundArk(
          'eligible',
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
        ),
      ).rejects.toEqual(new Error('transaction must have exactly one input'));
    });

    test('should throw when refund transaction input does not match checkpoint transaction id', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: randomBytes(32),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });
      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });
      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      await expect(
        signer.signRefundArk(
          'eligible',
          Buffer.from(refundTx.toPSBT(0)).toString('base64'),
          Buffer.from(checkpoint.toPSBT(0)).toString('base64'),
        ),
      ).rejects.toEqual(new Error('transaction is not for this swap'));
    });

    test('should sign refunds', async () => {
      const txId = randomBytes(32);
      const vout = 21;
      const swapId = 'eligible';

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        id: swapId,
        pair: 'ARK/BTC',
        chainCurrency: 'ARK',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: getHexString(txId),
        lockupTransactionVout: vout,
      });

      SwapRepository.setRefundSignatureCreated = jest.fn();

      const checkpoint = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      checkpoint.addInput({
        txid: txId,
        index: vout,
        witnessUtxo: {
          amount: BigInt(10_001),
          script: Buffer.alloc(32),
        },
      });

      checkpoint.addOutput({
        amount: BigInt(10_000),
        script: Buffer.alloc(32),
      });

      checkpoint['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const refundTx = new ScureTransaction({
        allowUnknownOutputs: true,
      });
      refundTx.addInput({
        txid: Buffer.from(checkpoint.id, 'hex'),
        index: 0,
        witnessUtxo: {
          amount: BigInt(10_000),
          script: Buffer.alloc(32),
        },
      });

      refundTx.addOutput({
        amount: BigInt(9_000),
        script: Buffer.alloc(32),
      });

      refundTx['inputs'][0].finalScriptSig = Buffer.alloc(64);

      const signedRefundTx = 'signedRefundTx';
      const signedCheckpoint = 'signedCheckpoint';
      arkCurrency.arkNode!.signTransaction = jest
        .fn()
        .mockResolvedValueOnce(signedRefundTx)
        .mockResolvedValueOnce(signedCheckpoint);

      const inputRefundTx = Buffer.from(refundTx.toPSBT(0)).toString('base64');
      const inputCheckpoint = Buffer.from(checkpoint.toPSBT(0)).toString(
        'base64',
      );

      await expect(
        signer.signRefundArk(swapId, inputRefundTx, inputCheckpoint),
      ).resolves.toEqual({
        transaction: signedRefundTx,
        checkpoint: signedCheckpoint,
      });

      expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(1);
      expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(
        swapId,
      );

      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenCalledTimes(2);
      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenNthCalledWith(
        1,
        inputRefundTx,
      );
      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenNthCalledWith(
        2,
        inputCheckpoint,
      );
    });
  });

  describe('hasPendingHtlcs', () => {
    const hasPendingHtlcs = signer['hasPendingHtlcs'];

    test('should return false when there are no pending HTLCs', async () => {
      btcCurrency.lndClient.listChannels = jest.fn().mockResolvedValue([]);
      btcCurrency.clnClient.listChannels = jest.fn().mockResolvedValue([]);

      await expect(hasPendingHtlcs('BTC', randomBytes(32))).resolves.toEqual(
        false,
      );
    });

    test('should return true when there are pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);
      btcCurrency.clnClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return true when LND has pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);
      btcCurrency.clnClient.listChannels = jest.fn().mockResolvedValue([]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return true when CLN has pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest.fn().mockResolvedValue([]);
      btcCurrency.clnClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return false when currency is undefined', async () => {
      await expect(
        hasPendingHtlcs('unknown', randomBytes(32)),
      ).resolves.toEqual(false);
    });
  });
});
