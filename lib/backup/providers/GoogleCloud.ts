import { Bucket, Storage } from '@google-cloud/storage';
import { readFileSync } from 'fs';
import { BackupProvider } from '../BackupScheduler';

type GoogleCloudConfig = {
  email: string;
  privatekeypath: string;

  bucketname: string;
};

class GoogleCloud implements BackupProvider {
  private readonly bucket: Bucket;

  constructor(config: GoogleCloudConfig) {
    const storage = new Storage({
      credentials: {
        client_email: config.email,
        private_key: readFileSync(config.privatekeypath, 'utf-8'),
      },
    });

    this.bucket = storage.bucket(config.bucketname);
  }

  public static configValid = (config: GoogleCloudConfig): boolean => {
    return (
      config.email !== '' &&
      config.privatekeypath !== '' &&
      config.bucketname !== ''
    );
  };

  public uploadString = (path: string, data: string): Promise<void> => {
    const file = this.bucket!.file(path);
    return file.save(data);
  };

  public uploadFile = async (path: string, file: string): Promise<void> => {
    await this.bucket!.upload(file, {
      destination: path,
    });
  };
}

export default GoogleCloud;
export { GoogleCloudConfig };
