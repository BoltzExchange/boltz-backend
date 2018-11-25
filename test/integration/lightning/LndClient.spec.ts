import { expect } from 'chai';
import path from 'path';
import Logger from '../../../lib/Logger';
import LndClient from '../../../lib/lightning/LndClient';
import { UtxoManager, btcdClient, btcManager, ltcdClient, ltcManager } from '../chain/ChainClient.spec';
import ChainClient from '../../../lib/chain/ChainClient';

describe('LndClient', () => {
  before(async () => {
    await Promise.all([
      btcdClient.connect(),
      ltcdClient.connect(),
    ]);
  });

  const channelCapacity = 10000000;

  let lndBtc2PubKey: string;
  let lndLtc2PubKey: string;

  it('LndClients should connect', async () => {
    await Promise.all([
      connectPromise(lndBtcClient1, lndBtcClient2),
      connectPromise(lndLtcClient1, lndLtcClient2),
    ]);

    // Connect the LNDs to eachother
    const lndBtc2Info = await lndBtcClient2.getInfo();
    const lndLtc2Info = await lndLtcClient2.getInfo();

    try {
      await lndBtcClient1.connectPeer(lndBtc2Info.identityPubkey, 'lnd:9735');
      await lndLtcClient1.connectPeer(lndLtc2Info.identityPubkey, 'lnd:9735');
    } catch (error) {
      // Handle "already connected" errors gracefully
      if (!error.details.startsWith('already connected to peer:')) {
        throw error;
      }
    }

    lndBtc2PubKey = lndBtc2Info.identityPubkey;
    lndLtc2PubKey = lndLtc2Info.identityPubkey;
  });

  it('LndClients should fund get funds', async () => {
    const fundLndWallet = async (utxoManager: UtxoManager, lndClient: LndClient) => {
      const addressResponse = await lndClient.newAddress();
      const tx = utxoManager.constructTransaction(addressResponse.address, channelCapacity * 400);

      await utxoManager.broadcastAndMine(tx.toHex());
    };

    await Promise.all([
      fundLndWallet(btcManager, lndBtcClient1),
      fundLndWallet(ltcManager, lndLtcClient1),
    ]);

    // Wait until the LNDs are in sync
    await connectPromise(lndBtcClient1, lndBtcClient2);
    await connectPromise(lndLtcClient1, lndLtcClient2);
  });

  it('LndClients should open a channel to eachother', async () => {
    expect(lndBtc2PubKey).to.not.be.undefined;
    expect(lndLtc2PubKey).to.not.be.undefined;

    const openChannel = async (chainClient: ChainClient, lndClient: LndClient, remoteLndPubKey: string) => {
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          try {
            await lndClient.openChannel(remoteLndPubKey, channelCapacity, channelCapacity / 2),
            await chainClient.generate(10);

            clearInterval(interval);
            resolve();
          } catch (error) {
            // Don't throw an error if the problem is LND not being synced yet
            if (error.details !== 'channels cannot be created before the wallet is fully synced') {
              throw error;
            }
          }
        }, 500);
      });
    };

    await Promise.all([
      openChannel(btcdClient, lndBtcClient1, lndBtc2PubKey),
      openChannel(ltcdClient, lndLtcClient1, lndLtc2PubKey),
    ]);
  });

  after(async () => {
    await Promise.all([
      lndBtcClient1.disconnect(),
      lndBtcClient2.disconnect(),

      lndLtcClient1.disconnect(),
      lndLtcClient2.disconnect(),

      btcdClient.disconnect(),
      ltcdClient.disconnect(),
    ]);
  });
});

const connectPromise = async (client1: LndClient, client2: LndClient) => {
  return new Promise(async (resolve) => {
    await client1.connect();
    await client2.connect();

    const interval = setInterval(async () => {
      if (client1.isConnected() && client2.isConnected()) {
        // To make sure the LNDs are *really* synced
        try {
          await client1.connectPeer('', '');
          await client2.connectPeer('', '');
        } catch (error) {
          if (error.details === 'pubkey string is empty') {
            clearInterval(interval);
            resolve();
          }
        }
      }
    }, 1000);
  });
};

const certpath = path.join('docker', 'data', 'certs', 'lnd', 'tls.cert');
const host = process.platform === 'win32' ? '192.168.99.100' : 'localhost';

export const lndBtcClient1 = new LndClient(Logger.disabledLogger, {
  certpath,
  host,
  port: 10009,
  macaroonpath: '',
}, 'BTC');

export const lndBtcClient2 = new LndClient(Logger.disabledLogger, {
  certpath,
  host,
  port: 10010,
  macaroonpath: '',
}, 'LTC');

export const lndLtcClient1 = new LndClient(Logger.disabledLogger, {
  certpath,
  host,
  port: 11009,
  macaroonpath: '',
}, 'LTC');

export const lndLtcClient2 = new LndClient(Logger.disabledLogger, {
  certpath,
  host,
  port: 11010,
  macaroonpath: '',
}, 'LTC');
