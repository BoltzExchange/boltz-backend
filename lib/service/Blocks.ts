import axios from 'axios';
import Logger from '../Logger';

type BlocksConfig = {
  urls?: string[];
};

class Blocks {
  private blocked = new Set<string>();

  constructor(
    private readonly logger: Logger,
    private readonly config: BlocksConfig,
  ) {}

  public updateBlocks = async () => {
    if (this.config.urls === undefined || this.config.urls.length === 0) {
      return;
    }

    const addresses = await Promise.all(
      this.config.urls.map(async (url) => {
        const response = await axios.get<string[]>(url);
        this.logger.verbose(
          `Fetched ${response.data.length} blocked addresses from: ${url}`,
        );
        return response.data;
      }),
    );

    for (const addr of addresses.flat()) {
      this.blocked.add(addr);
    }
  };

  public isBlocked = (addr: string) => this.blocked.has(addr);
}

export default Blocks;
export { BlocksConfig };
