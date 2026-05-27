import SwapRoutingMetadata from '../models/SwapRoutingMetadata';

class SwapRoutingMetadataRepository {
  public static add = (swapId: string, data: Buffer) =>
    SwapRoutingMetadata.create({
      swapId,
      data,
    });

  public static get = (swapId: string) =>
    SwapRoutingMetadata.findOne({
      where: {
        swapId,
      },
    });
}

export default SwapRoutingMetadataRepository;
