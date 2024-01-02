import ops from '@boltz/bitcoin-ops';
import { Transaction, address, initEccLib } from 'bitcoinjs-lib';
import { Networks } from 'boltz-core';
import * as ecc from 'tiny-secp256k1';
import Logger from '../../../../lib/Logger';
import { AddressType } from '../../../../lib/chain/ChainClient';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';
import { bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

const testAddress = 'bcrt1q54g5dyexre4dg78ymnzz2y8h9xfptjrtxxakn6';

describe('CoreWalletProvider', () => {
  const provider = new CoreWalletProvider(Logger.disabledLogger, bitcoinClient);

  const verifySentTransaction = async (
    sentTransaction: SentTransaction,
    destination: string,
    amount: number,
    isSweep: boolean,
    feePerVbyte?: number,
  ) => {
    const rawTransaction = await bitcoinClient.getRawTransactionVerbose(
      sentTransaction.transactionId,
    );

    expect(sentTransaction.transactionId).toEqual(rawTransaction.txid);
    expect(sentTransaction.transactionId).toEqual(
      sentTransaction.transaction!.getId(),
    );
    expect(sentTransaction.transaction).toEqual(
      Transaction.fromHex(rawTransaction.hex),
    );

    expect(
      rawTransaction.vout[sentTransaction.vout!].scriptPubKey.addresses,
    ).toEqual(undefined);
    expect(
      rawTransaction.vout[sentTransaction.vout!].scriptPubKey.address,
    ).toEqual(destination);

    const expectedAmount = isSweep
      ? Math.round(amount - sentTransaction.fee!)
      : amount;
    expect(
      sentTransaction.transaction!.outs[sentTransaction.vout!].value,
    ).toEqual(expectedAmount);

    let outputSum = 0;

    for (const vout of sentTransaction.transaction!.outs) {
      outputSum += vout.value as number;
    }

    let inputSum = 0;

    for (const vin of rawTransaction.vin) {
      const inputTransaction = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(vin.txid),
      );
      inputSum += inputTransaction.outs[vin.vout].value;
    }

    expect(sentTransaction.fee).toEqual(inputSum - outputSum);

    if (feePerVbyte) {
      expect(
        Math.round((sentTransaction.fee as number) / rawTransaction.vsize),
      ).toEqual(feePerVbyte);
    }
  };

  beforeAll(async () => {
    initEccLib(ecc);
    await bitcoinClient.connect();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  beforeEach(async () => {
    await bitcoinClient.generate(1);
  });

  it('should generate Taproot addresses by default', async () => {
    const addr = await provider.getAddress();
    expect(addr.startsWith('bcrt1')).toEqual(true);
    // Taproot => Witness program starts with 1
    expect(address.toOutputScript(addr, Networks.bitcoinRegtest)[0]).toEqual(
      ops.OP_1,
    );
  });

  it('should generate different kinds of addresses', async () => {
    const addr = await provider.getAddress(AddressType.Bech32);
    expect(addr.startsWith('bcrt1')).toEqual(true);
    // SegWit => Witness program starts with 0
    expect(address.toOutputScript(addr, Networks.bitcoinRegtest)[0]).toEqual(
      ops.OP_0,
    );

    expect(
      (await provider.getAddress(AddressType.P2shegwit)).startsWith('2'),
    ).toBeTruthy();

    const legacyAddress = await provider.getAddress(AddressType.Legacy);
    expect(
      legacyAddress.startsWith('m') || legacyAddress.startsWith('n'),
    ).toBeTruthy();
  });

  it('should get balance', async () => {
    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
  });

  it('should get unconfirmed balance correctly', async () => {
    await provider.sendToAddress(await provider.getAddress(), 10000);

    const balance = await provider.getBalance();
    expect(balance.unconfirmedBalance).toBeGreaterThan(0);
  });

  it('should send transactions', async () => {
    const amount = 212121;
    const sentTransaction = await provider.sendToAddress(testAddress, amount);

    await verifySentTransaction(sentTransaction, testAddress, amount, false);
  });

  it('should send transactions with a specific fee', async () => {
    const amount = 45789;
    const feePerVByte = 21;

    const tx = await provider.sendToAddress(testAddress, amount, feePerVByte);

    await verifySentTransaction(tx, testAddress, amount, false, feePerVByte);
  });

  it('should send transactions that do not signal RBF', async () => {
    const amount = 321312;
    const addr = await provider.getAddress();
    const { transaction } = await provider.sendToAddress(addr, amount);
    expect(transaction).toBeDefined();
    expect(
      transaction!.ins.every((vin) => vin.sequence === 0xffffffff - 1),
    ).toBeTruthy();
  });

  it('should sweep the wallet', async () => {
    const balance = await provider.getBalance();
    const sentTransaction = await provider.sweepWallet(testAddress);

    await verifySentTransaction(
      sentTransaction,
      testAddress,
      balance.confirmedBalance,
      true,
    );

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });
});
