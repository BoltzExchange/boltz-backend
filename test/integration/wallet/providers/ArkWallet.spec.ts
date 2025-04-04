import Logger from '../../../../lib/Logger';
import ArkClient from '../../../../lib/chain/ArkClient';
import AspClient from '../../../../lib/chain/AspClient';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';
import ArkWallet from '../../../../lib/wallet/providers/ArkWallet';
import { arkClient, aspUrl, bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

describe('ArkWallet', () => {
  const wallet = new ArkWallet(Logger.disabledLogger, arkClient);

  beforeAll(async () => {
    await bitcoinClient.connect();
    await arkClient.connect(bitcoinClient);
  });

  afterAll(async () => {
    arkClient.disconnect();
    bitcoinClient.disconnect();
  });

  test('should get service name', () => {
    expect(wallet.serviceName()).toEqual('Fulmine');
  });

  test('should get balance', async () => {
    const balance = await wallet.getBalance();
    expect(balance.confirmedBalance).toBeGreaterThan(1);
    expect(balance.unconfirmedBalance).toEqual(0);
  });

  test('should get address', async () => {
    const address = await wallet.getAddress();

    const decoded = ArkClient.decodeAddress(address);
    expect(decoded.serverPubKey).toBeDefined();
    expect(decoded.serverPubKey).toHaveLength(32);
    expect(decoded.tweakedPubKey).toBeDefined();
    expect(decoded.tweakedPubKey).toHaveLength(32);
  });

  test('should send to address', async () => {
    const address = await wallet.getAddress();
    const amount = 10_000;
    const label = 'test';

    TransactionLabelRepository.addLabel = jest.fn();

    const sentTransaction = await wallet.sendToAddress(
      address,
      amount,
      undefined,
      label,
    );
    expect(sentTransaction.transactionId).toBeDefined();
    expect(sentTransaction.vout).toBeDefined();
    expect(sentTransaction.fee).toEqual(0);

    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      sentTransaction.transactionId,
      ArkClient.symbol,
      label,
    );

    const tx = await new AspClient(aspUrl).getTx(sentTransaction.transactionId);

    const pubkey = ArkClient.decodeAddress(address).tweakedPubKey;
    expect(
      AspClient.mapOutputs(tx).findIndex(
        (output) =>
          output.amount === BigInt(amount) &&
          Buffer.from(output.script!).subarray(2).equals(pubkey),
      ),
    ).toEqual(sentTransaction.vout);
  });

  test('should sweep wallet', async () => {
    const address = await wallet.getAddress();
    const label = 'test';

    const amount = (await wallet.getBalance()).confirmedBalance;

    const sentTransaction = await wallet.sweepWallet(address, undefined, label);
    expect(sentTransaction.transactionId).toBeDefined();
    expect(sentTransaction.vout).toBeDefined();
    expect(sentTransaction.fee).toEqual(0);

    expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
      sentTransaction.transactionId,
      ArkClient.symbol,
      label,
    );

    const tx = await new AspClient(aspUrl).getTx(sentTransaction.transactionId);

    const pubkey = ArkClient.decodeAddress(address).tweakedPubKey;
    expect(
      AspClient.mapOutputs(tx).findIndex(
        (output) =>
          output.amount === BigInt(amount) &&
          Buffer.from(output.script!).subarray(2).equals(pubkey),
      ),
    ).toEqual(sentTransaction.vout);
  });
});
