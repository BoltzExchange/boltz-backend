import SwapMetadata from '../models/SwapMetadata';

class SwapMetadataRepository {
  public static add = (swapId: string, metadata: string) =>
    SwapMetadata.create({
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
