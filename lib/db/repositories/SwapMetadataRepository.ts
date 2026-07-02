import SwapMetadata from '../models/SwapMetadata';

class SwapMetadataRepository {
  public static add = (swapId: string, metadata: Buffer) =>
    SwapMetadata.create({
      swapId,
      data: metadata,
    });

  public static set = (swapId: string, metadata: Buffer) =>
    SwapMetadata.upsert({
      swapId,
      data: metadata,
    });

  public static get = (swapId: string) =>
    SwapMetadata.findOne({
      where: {
        swapId,
      },
    });
}

export default SwapMetadataRepository;
