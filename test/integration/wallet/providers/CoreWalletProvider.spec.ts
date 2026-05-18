import { hexToBytes } from '@noble/hashes/utils.js';
import { Transaction } from '@scure/btc-signer';
import { outputScriptFromAddress } from '../../../../lib/AddressUtils';
import Logger from '../../../../lib/Logger';
import { AddressType } from '../../../../lib/chain/ChainClient';
import { CurrencyType } from '../../../../lib/consts/Enums';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import type { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';
import { regtest as bitcoinRegtest } from '../../../Networks';
import { bitcoinClient, bitcoinLndClient } from '../../Nodes';

const OP_0 = 0x00;
const OP_1 = 0x51;

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

const testAddress = 'bcrt1q54g5dyexre4dg78ymnzz2y8h9xfptjrtxxakn6';

describe('CoreWalletProvider', () => {
  const provider = new CoreWalletProvider(
    Logger.disabledLogger,
    bitcoinClient,
    bitcoinRegtest,
  );

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

    const sentTx = sentTransaction.transaction! as Transaction;

    expect(sentTransaction.transactionId).toEqual(rawTransaction.txid);
    expect(sentTransaction.transactionId).toEqual(sentTx.id);
    expect(sentTx.hex).toEqual(
      Transaction.fromRaw(hexToBytes(rawTransaction.hex)).hex,
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
    expect(Number(sentTx.getOutput(sentTransaction.vout!).amount)).toEqual(
      expectedAmount,
    );

    let outputSum = 0;

    for (let i = 0; i < sentTx.outputsLength; i++) {
      outputSum += Number(sentTx.getOutput(i).amount);
    }

    let inputSum = 0;

    for (const vin of rawTransaction.vin) {
      const inputTransaction = Transaction.fromRaw(
        hexToBytes(await bitcoinClient.getRawTransaction(vin.txid)),
        {
          allowUnknownOutputs: true,
          allowUnknownInputs: true,
          allowLegacyWitnessUtxo: true,
        },
      );
      inputSum += Number(inputTransaction.getOutput(vin.vout).amount);
    }

    expect(sentTransaction.fee).toEqual(inputSum - outputSum);

    if (feePerVbyte) {
      expect(
        Math.round((sentTransaction.fee as number) / rawTransaction.vsize),
      ).toEqual(feePerVbyte);
    }
  };

  beforeAll(async () => {
    await bitcoinLndClient.connect(false);
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  beforeEach(async () => {
    await bitcoinClient.generate(1);
  });

  describe('getAddress', () => {
    it('should set label', async () => {
      const label = 'something swap related';
      const addr = await provider.getAddress(label);

      const addressInfo = await bitcoinClient.getAddressInfo(addr);
      expect(addressInfo.labels).toEqual([label]);
    });

    it('should generate Taproot addresses by default', async () => {
      const addr = await provider.getAddress('');
      expect(addr.startsWith('bcrt1')).toEqual(true);
      // Taproot => Witness program starts with 1
      expect(
        outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          addr,
          bitcoinRegtest,
        )[0],
      ).toEqual(OP_1);
    });

    it('should generate different kinds of addresses', async () => {
      const addr = await provider.getAddress('', AddressType.Bech32);
      expect(addr.startsWith('bcrt1')).toEqual(true);
      // SegWit => Witness program starts with 0
      expect(
        outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          addr,
          bitcoinRegtest,
        )[0],
      ).toEqual(OP_0);

      expect(
        (await provider.getAddress('', AddressType.P2shegwit)).startsWith('2'),
      ).toBeTruthy();

      const legacyAddress = await provider.getAddress('', AddressType.Legacy);
      expect(
        legacyAddress.startsWith('m') || legacyAddress.startsWith('n'),
      ).toBeTruthy();
    });
  });

  describe('getBalance', () => {
    it('should get confirmed balance', async () => {
      const balance = await provider.getBalance();

      expect(balance.confirmedBalance).toBeGreaterThan(0);
    });

    it('should get safe unconfirmed balance correctly', async () => {
      await provider.sendToAddress(
        await provider.getAddress(''),
        10000,
        undefined,
        '',
      );

      const balance = await provider.getBalance();
      expect(balance.unconfirmedBalance).toEqual(0);
    });

    it('should get unsafe unconfirmed balance correctly', async () => {
      await bitcoinLndClient.sendCoins(
        await provider.getAddress(''),
        10_000,
        undefined,
        '',
      );

      const balance = await provider.getBalance();
      expect(balance.unconfirmedBalance).toBeGreaterThan(0);
    });
  });

  it('should send transactions', async () => {
    const amount = 212121;
    const label = 'send from Core wallet';

    const sentTransaction = await provider.sendToAddress(
      testAddress,
      amount,
      undefined,
      label,
    );

    const transactionInfo = await bitcoinClient.getWalletTransaction(
      sentTransaction.transactionId,
    );
    expect(transactionInfo.comment).toEqual(label);

    await verifySentTransaction(sentTransaction, testAddress, amount, false);
  });

  it('should send transactions with a specific fee', async () => {
    const amount = 45789;
    const feePerVByte = 21;

    const tx = await provider.sendToAddress(
      testAddress,
      amount,
      feePerVByte,
      '',
    );

    await verifySentTransaction(tx, testAddress, amount, false, feePerVByte);
  });

  it('should send transactions that do not signal RBF', async () => {
    const amount = 321312;
    const addr = await provider.getAddress('');
    const { transaction } = await provider.sendToAddress(
      addr,
      amount,
      undefined,
      '',
    );
    expect(transaction).toBeDefined();
    const scureTx = transaction! as Transaction;
    const inputs = Array.from({ length: scureTx.inputsLength }, (_, i) =>
      scureTx.getInput(i),
    );
    expect(inputs.every((vin) => vin.sequence === 0xffffffff - 1)).toBeTruthy();
  });

  it('should sweep the wallet', async () => {
    const balance = await provider.getBalance();
    const label = 'sweep Core wallet';

    const sentTransaction = await provider.sweepWallet(
      testAddress,
      undefined,
      label,
    );

    const transactionInfo = await bitcoinClient.getWalletTransaction(
      sentTransaction.transactionId,
    );
    expect(transactionInfo.comment).toEqual(label);

    await verifySentTransaction(
      sentTransaction,
      testAddress,
      balance.confirmedBalance,
      true,
    );

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });
});
