import fs from 'fs';
import { getHeapSnapshot } from 'v8';

export const dumpHeap = async (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    const snapshot = getHeapSnapshot();
    const fileStream = fs.createWriteStream(filePath);
    snapshot.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.end();
      resolve();
    });
    fileStream.on('error', (err) => reject(err));
  });
