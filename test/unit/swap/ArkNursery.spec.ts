import { Transaction } from '@scure/btc-signer';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import type ArkClient from '../../../lib/chain/ArkClient';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import ArkNursery from '../../../lib/swap/ArkNursery';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';

describe('ArkNursery', () => {
  const nursery = new ArkNursery(
    Logger.disabledLogger,
    new OverpaymentProtector(Logger.disabledLogger),
  );

  const claimTx = Transaction.fromPSBT(
    Buffer.from(
      'cHNidP8BAF4CAAAAAWPfskEdPmcBOdo0T5mn3q9HIcvmAypSMUXfPS9jfDE4AAAAAAD/////ASsIAAAAAAAAIlEgle/dbLckDE8iEbi89OvrKt3XVYzl7dbfwijm16D5Hc0AAAAAAAEBKysIAAAAAAAAIlEg8cE8bmnhX3pxvBuj8KK34xSci670SjK/tB89js+1FEZBFDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OtyFGcJzqh5wD/F1rqTBJKrFl74LpQNfQkrRhwpg9xNhA8Bc/3s7XznAkhMHiaQZR1jr9blFjKO5TAxczFrrByAlyx7WDMR/PxWSxJE10n4NCD/dToiGGKksdlVMUYGo4GUEUjSlkVbD0B82qdfrXguY1RmOt4k3tTKKVftBjq9Hrowi3IUZwnOqHnAP8XWupMEkqsWXvgulA19CStGHCmD3E2ECpF8c1EKlH4XJQN6iAHEzjA+s7SwD0pevfk/jjjouAAJaTXKWoB5bPghqzfnvqjrqVTKtxs5vo1GXSyuuKF/rtghXAUJKbdMGgSVS3i0tgNel6XgeKWg8o7JbVR7/ums6AOsDsoe3NA/skK3hvHck89R0toNx5H6OnbWhDseKnxjxh7MmMVDr5u9QcsOG72qzIKma9q2uRZN6/kzCPWoP57x3V6okLO9SOLLr71CkV3VzmJs1yRfQcr+pXgCkIz9D3nuNdqRQb35P0qMoenROI9+jSTFfvo835C4dpIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKzADP3/AGNvbmRpdGlvbiIBIHQRY1k+sfq4E+aYbfuyvZLZHHb49eLwTKXcZ+gXDh8ICv3/AHRhcHRyZWX9zgEGAcBcqRQb35P0qMoenROI9+jSTFfvo835C4dpIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKwBwGYgif9h5mAC+0zo4VcCQlqbx7zmUMSM+i7h4czTuukE1KmtIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKwBwEoDgLsAsXUgif9h5mAC+0zo4VcCQlqbx7zmUMSM+i7h4czTuukE1KmtII0pZFWw9AfNqnX614LmNUZjreJN7UyilX7QY6vR66MIrAHAP6kUG9+T9KjKHp0TiPfo0kxX76PN+QuHaQKGALJ1IDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrAHASQIGAbJ1IIn/YeZgAvtM6OFXAkJam8e85lDEjPou4eHM07rpBNSprSAwAPAbdKs6fkdHRXFjqPqnH/1f5HNNrbuiISMwbUjvzqwBwCcCBgGydSCJ/2HmYAL7TOjhVwJCWpvHvOZQxIz6LuHhzNO66QTUqawAAA==',
      'base64',
    ),
  );
  const claimTxPreimage = getHexBuffer(
    '741163593eb1fab813e6986dfbb2bd92d91c76f8f5e2f04ca5dc67e8170e1f08',
  );

  describe('checkClaims', () => {
    test('should check reverse swap claims', async () => {
      const aspClient = {
        getTx: jest.fn().mockResolvedValue(claimTx),
      };

      const swap = {
        id: 'rev',
      };
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(swap);

      jest.spyOn(nursery, 'emit');

      await nursery['checkClaims'](
        {
          aspClient,
        } as unknown as ArkClient,
        {
          spentBy: 'txid',
        } as unknown as any,
      );

      expect(aspClient.getTx).toHaveBeenCalledWith('txid');
      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
        preimageHash:
          '12882524ddbee7d099e2bf6dc2f32d320dfc0a01939bf2fd2cef181f27f5e26c',
      });
      expect(nursery.emit).toHaveBeenCalledWith('reverseSwap.claimed', {
        reverseSwap: swap,
        preimage: claimTxPreimage,
      });
    });
  });

  describe('extractPreimages', () => {
    test('should extract preimage from claim transaction', () => {
      const preimages = ArkNursery['extractPreimages'](claimTx);
      expect(preimages.length).toEqual(1);

      const preimage = preimages[0];
      expect(preimage.length).toEqual(32);
      expect(getHexString(preimage)).toEqual(getHexString(claimTxPreimage));
    });
  });
});
