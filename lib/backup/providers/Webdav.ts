import fs from 'fs';
import { dirname } from 'path';
import { createClient, WebDAVClient } from 'webdav';
import { BackupProvider } from '../BackupScheduler';

type WebdavConfig = {
  url: string;
  username: string;
  password: string;
};

class Webdav implements BackupProvider {
  private readonly client: WebDAVClient;

  constructor(config: WebdavConfig) {
    this.client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });
  }

  public static configValid = (config: WebdavConfig): boolean => {
    return (
      config.url !== '' && config.username !== '' && config.password !== ''
    );
  };

  public uploadString = async (path: string, data: string): Promise<void> => {
    await this.createDirectory(path);
    await this.client.putFileContents(path, data, {
      overwrite: true,
    });
  };

  public uploadFile = async (path: string, file: string): Promise<void> => {
    await this.createDirectory(path);

    return new Promise((resolve, reject) => {
      const stats = fs.statSync(file);
      fs.createReadStream(file)
        .pipe(
          this.client
            .createWriteStream(path, {
              headers: {
                'Content-Length': stats.size.toString(),
              },
              overwrite: true,
            })
            .on('error', (error) => {
              reject(error);
            }),
        )
        .on('finish', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  };

  private createDirectory = async (path: string) => {
    if (!path.includes('/')) {
      return;
    }

    const dir = dirname(path);
    if (await this.client.exists(dir)) {
      return;
    }

    await this.client.createDirectory(dir, {
      recursive: true,
    });
  };
}

export default Webdav;
export { WebdavConfig };
