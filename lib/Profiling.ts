import Pyroscope from '@pyroscope/nodejs';
import packageJson from '../package.json';

class Profiling {
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
  };

  public stop = () => Pyroscope.stop();
}

export default new Profiling();
