import secp256k1 from '@vulpemventures/secp256k1-zkp';
import { address, confidential, Transaction } from 'liquidjs-lib';
import Logger from '../../../../lib/Logger';
import { elementsClient } from '../../Nodes';
import { getHexBuffer } from '../../../../lib/Utils';
import { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';
import ElementsWalletProvider from '../../../../lib/wallet/providers/ElementsWalletProvider';

const testAddress =
  'el1qqgh7rw4ljyga4t4jgahjwyj38swcstwpt5xk7h7ajpv5pcu9txj5nqknww3eslawknlgy09mhc0efupluvh4j9w4n94nw8pmk';
const testUnblindingKey = getHexBuffer(
  'b7cd57b71f617a14bd6e143468987ce4399fc1caa0c55a4f6d9e733d32505087',
);

describe('ElementsWalletProvider', () => {
  let cf: confidential.Confidential;
  const provider = new ElementsWalletProvider(
    Logger.disabledLogger,
    elementsClient,
  );

  const verifySentTransaction = async (
    sentTransaction: SentTransaction,
    destination: string,
    amount: number,
    isSweep: boolean,
    unblindingKey?: Buffer,
    feePerVbyte?: number,
  ) => {
    const rawTransaction = await elementsClient.getRawTransactionVerbose(
      sentTransaction.transactionId,
    );
    const decodedTx = Transaction.fromHex(rawTransaction.hex);

    expect(sentTransaction.transactionId).toEqual(rawTransaction.txid);
    expect(sentTransaction.transactionId).toEqual(
      sentTransaction.transaction!.getId(),
    );
    expect(sentTransaction.transaction).toEqual(decodedTx);

    expect(
      rawTransaction.vout[sentTransaction.vout!].scriptPubKey.addresses,
    ).toEqual(undefined);
    expect(
      rawTransaction.vout[sentTransaction.vout!].scriptPubKey.address,
    ).toEqual(
      (await elementsClient.getAddressInfo(destination)).unconfidential,
    );

    const decodedFee = confidential.confidentialValueToSatoshi(
      decodedTx.outs[decodedTx.outs.length - 1].value,
    );
    // Hack to work around a weird liquidjs-lib off by one bug
    expect(
      sentTransaction.fee === decodedFee ||
        sentTransaction.fee === decodedFee + 1,
    ).toEqual(true);

    const expectedAmount = isSweep
      ? Math.round(amount - sentTransaction.fee!)
      : amount;

    const output = (sentTransaction.transaction as Transaction).outs[
      sentTransaction.vout!
    ];
    expect(
      unblindingKey
        ? Number(cf.unblindOutputWithKey(output, unblindingKey).value)
        : confidential.confidentialValueToSatoshi(output.value),
    ).toEqual(expectedAmount);

    if (feePerVbyte) {
      expect(
        Math.round((sentTransaction.fee as number) / rawTransaction.vsize),
      ).toEqual(feePerVbyte);
    }
  };

  beforeAll(async () => {
    cf = new confidential.Confidential(await secp256k1());
  });

  beforeEach(async () => {
    await elementsClient.generate(1);
  });

  it('should generate addresses', async () => {
    expect((await provider.getAddress()).startsWith('el1qq')).toEqual(true);
  });

  it('should get balance', async () => {
    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.totalBalance).toEqual(
      balance.confirmedBalance + balance.unconfirmedBalance,
    );
  });

  it('should send transactions to confidential addresses', async () => {
    const amount = 212121;
    const sentTransaction = await provider.sendToAddress(testAddress, amount);

    await verifySentTransaction(
      sentTransaction,
      testAddress,
      amount,
      false,
      testUnblindingKey,
    );
  });

  it('should send transactions to unconfidential addresses', async () => {
    const amount = 42123;
    const sentTransaction = await provider.sendToAddress(
      address.fromConfidential(testAddress).unconfidentialAddress,
      amount,
    );

    await verifySentTransaction(sentTransaction, testAddress, amount, false);
  });

  it('should send transactions with a specific fee', async () => {
    const amount = 3457236;
    const feePerVByte = 21;

    const tx = await provider.sendToAddress(testAddress, amount, feePerVByte);

    await verifySentTransaction(
      tx,
      testAddress,
      amount,
      false,
      testUnblindingKey,
      feePerVByte,
    );
  });

  it('should send transactions that do not signal RBF', async () => {
    const amount = 31222;
    const addr = await provider.getAddress();
    const { transaction } = await provider.sendToAddress(addr, amount);
    expect(transaction).toBeDefined();
    expect(
      transaction!.ins.every((vin) => vin.sequence === 0xffffffff - 1),
    ).toBeTruthy();
  });

  it('should sweep the wallet', async () => {
    const balance = await provider.getBalance();
    const sweepAddress = await provider.getAddress();
    const blindingKey = await provider.dumpBlindingKey(sweepAddress);

    const sentTransaction = await provider.sweepWallet(sweepAddress);

    await verifySentTransaction(
      sentTransaction,
      sweepAddress,
      balance.confirmedBalance,
      true,
      blindingKey,
    );

    // Two outputs; one to which we are sweeping and one for the fee
    expect(sentTransaction.transaction!.outs.length).toEqual(2);
    // The fee output has an empty script
    expect(
      (sentTransaction.transaction as Transaction).outs[1].script.length,
    ).toEqual(0);
  });
});
