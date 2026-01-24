import type { Application } from 'express';
import type Logger from '../../Logger';
import type Service from '../../service/Service';
import type SwapInfos from '../SwapInfos';
import { apiPrefix } from './Consts';
import ChainRouter from './routers/ChainRouter';
import CommitmentRouter from './routers/CommitmentRouter';
import InfoRouter from './routers/InfoRouter';
import NodesRouter from './routers/NodesRouter';
import ReferralRouter from './routers/ReferralRouter';
import type RouterBase from './routers/RouterBase';
import SwapRouter from './routers/SwapRouter';

class ApiV2 {
  private readonly routers: RouterBase[];

  constructor(
    private readonly logger: Logger,
    service: Service,
    swapInfos: SwapInfos,
  ) {
    this.routers = [
      new InfoRouter(this.logger, service),
      new SwapRouter(this.logger, service, swapInfos),
      new ChainRouter(this.logger, service),
      new CommitmentRouter(this.logger, service),
      new NodesRouter(this.logger, service),
      new ReferralRouter(this.logger),
    ];
  }

  public registerRoutes = (app: Application) => {
    this.routers.forEach((router) =>
      app.use(`${apiPrefix}/${router.path}`, router.getRouter()),
    );
  };
}

export default ApiV2;
