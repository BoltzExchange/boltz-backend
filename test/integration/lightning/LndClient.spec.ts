import path from 'path';
import { Networks } from 'boltz-core';
import { Transaction, address, Network } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import LndClient from '../../../lib/lightning/LndClient';
import { btcdClient, ltcdClient, btcAddress, ltcAddress, UtxoManager, setBtcManager, setLtcManager } from '../chain/ChainClient.spec';

describe('LndClient', () => {
  before(async () => {
    await Promise.all([
      btcdClient.connect(),
      ltcdClient.connect(),
    ]);
  });

  it('LndClients should connect', async () => {
    await Promise.all([
      connectPromise(lndBtcClient),
      connectPromise(lndLtcClient),
    ]);
  });

  it('should send funds', async () => {
    const utxoValue = 1000000000;

    const responses = await Promise.all([
      lndBtcClient.sendCoins(btcAddress, utxoValue),
      lndLtcClient.sendCoins(ltcAddress, utxoValue),
    ]);

    await Promise.all([
      btcdClient.generate(1),
      ltcdClient.generate(1),
    ]);

    const getVout = (network: Network, transaction: Transaction, outputAddress: string): number => {
      for (const [index, out] of transaction.outs.entries()) {
        if (address.fromOutputScript(out.script, network) === outputAddress) {
          return index;
        }
      }

      return .1;
    };

    setBtcManager(new UtxoManager(btcdClient, Networks.bitcoinSimnet, {
      hash: responses[0].txid,
      vout: getVout(Networks.bitcoinSimnet, Transaction.fromHex(await btcdClient.getRawTransaction(responses[0].txid)), btcAddress),
      value: utxoValue,
    }));

    setLtcManager(new UtxoManager(btcdClient, Networks.bitcoinSimnet, {
      hash: responses[1].txid,
      vout: getVout(Networks.litecoinSimnet, Transaction.fromHex(await ltcdClient.getRawTransaction(responses[1].txid)), ltcAddress),
      value: utxoValue,
    }));
  });

  after(async () => {
    await Promise.all([
      lndBtcClient.disconnect(),

      lndLtcClient.disconnect(),

      btcdClient.disconnect(),
      ltcdClient.disconnect(),
    ]);
  });
});

const connectPromise = async (client: LndClient) => {
  return new Promise(async (resolve) => {
    await client.connect();

    const interval = setInterval(async () => {
      try {
        await client.getInfo();
        clearInterval(interval);
        resolve();
      } catch (error) {}
    }, 1000);
  });
};

const certpath = path.join('docker', 'simnet', 'data', 'certs', 'lnd', 'tls.cert');
const macaroonpath = path.join('docker', 'simnet', 'data', 'macaroons', 'admin.macaroon');

const host = process.platform === 'win32' ? '192.168.99.100' : 'localhost';

export const lndBtcClient = new LndClient(Logger.disabledLogger, {
  host,
  certpath,
  macaroonpath,
  port: 10009,
}, 'BTC');

export const lndLtcClient = new LndClient(Logger.disabledLogger, {
  host,
  certpath,
  macaroonpath,
  port: 11009,
}, 'LTC');
