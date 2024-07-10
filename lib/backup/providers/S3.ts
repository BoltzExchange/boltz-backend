import { Client } from 'minio';
import { BackupProvider } from '../BackupScheduler';

type S3Config = {
  bucket: string;
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
};

class S3 implements BackupProvider {
  private readonly bucket: string;
  private readonly client: Client;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.client = new Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }

  public static configValid = (config: S3Config): boolean =>
    [
      config.bucket,
      config.endpoint,
      config.port,
      config.useSSL,
      config.accessKey,
      config.secretKey,
    ].every((entry) => entry !== null && entry !== undefined && entry !== '');

  public uploadString = async (path: string, data: string): Promise<void> => {
    await this.client.putObject(this.bucket, path, Buffer.from(data, 'utf-8'));
  };

  public uploadFile = (path: string, file: string): Promise<void> =>
    this.client.fPutObject(this.bucket, path, file);
}

export default S3;
export { S3Config };
