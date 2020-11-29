import Logger from '../Logger';
import LndClient from './LndClient';
import { formatError } from '../Utils';

class ConnectionHelper {
  constructor(private logger: Logger) {}

  public connectByPublicKey = async (lndClient: LndClient, publicKey: string): Promise<void> => {
    this.logger.verbose(`Trying to connect to LND ${lndClient.symbol} node: ${publicKey}`);

    // Fetch the publicly advertised addresses of the other LND node
    const nodeInfo = await lndClient.getNodeInfo(publicKey);

    if (nodeInfo.node === undefined || nodeInfo.node.addressesList.length === 0) {
      throw 'node does not advertise addresses';
    }

    let addressesMessage = `Found ${nodeInfo.node.addressesList.length} public addresses of ${publicKey}:`;

    nodeInfo.node.addressesList.forEach((address) => {
      addressesMessage += `\n - ${address.addr}`;
    });

    this.logger.debug(addressesMessage);

    for (const address of nodeInfo.node.addressesList) {
      this.logger.debug(`Trying to connect to LND ${lndClient.symbol} addresses: ${publicKey}@${address.addr}`);

      try {
        await lndClient.connectPeer(publicKey, address.addr);
      } catch (error) {
        this.logger.debug(`Could not connect to to LND ${lndClient.symbol} address ${publicKey}@${address.addr}: ${formatError(error)}`);

        // Try the next URI if that one did not work
        continue;
      }

      this.logger.verbose(`Connected to LND ${lndClient.symbol} node: ${publicKey}`);
      return;
    }

    throw 'could not connect to any of the advertised addresses';
  }
}

export default ConnectionHelper;
