import Pyroscope from '@pyroscope/nodejs';
import packageJson from '../package.json';

class Profiling {
  private initialized = false;

  public init = (endpoint: string, network: string) => {
    Pyroscope.init({
      serverAddress: endpoint,
      appName: `${packageJson.name}-${network}`,
      tags: {
        version: packageJson.version,
      },
      wall: {
        collectCpuTime: true,
      },
    });

    Pyroscope.start();
    this.initialized = true;
  };

  public stop = async () => {
    if (!this.initialized) {
      return;
    }

    await Pyroscope.stop();
  };
}

export default new Profiling();
