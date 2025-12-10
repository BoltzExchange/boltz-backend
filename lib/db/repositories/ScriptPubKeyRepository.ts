import type { CreateOptions } from 'sequelize';
import ScriptPubKey from '../models/ScriptPubKey';

class ScriptPubKeyRepository {
  public static add = async (
    swapId: string,
    symbol: string,
    scriptPubKey: Buffer,
    options: CreateOptions<ScriptPubKey>,
  ) => {
    return await ScriptPubKey.create(
      {
        swap_id: swapId,
        symbol,
        script_pubkey: scriptPubKey,
      },
      options,
    );
  };
}

export default ScriptPubKeyRepository;
