import { Application } from 'express';
import Logger from '../../Logger';
import Service from '../../service/Service';
import { apiPrefix } from './Consts';
import ChainRouter from './routers/ChainRouter';
import InfoRouter from './routers/InfoRouter';
import NodesRouter from './routers/NodesRouter';
import RouterBase from './routers/RouterBase';
import SwapRouter from './routers/SwapRouter';

class ApiV2 {
  private readonly routers: RouterBase[];

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
  ) {
    this.routers = [
      new InfoRouter(this.logger, this.service),
      new SwapRouter(this.logger, this.service),
      new ChainRouter(this.logger, this.service),
      new NodesRouter(this.logger, this.service),
    ];
  }

  public registerRoutes = (app: Application) => {
    this.routers.forEach((router) =>
      app.use(`${apiPrefix}/${router.path}`, router.getRouter()),
    );
  };
}

export default ApiV2;
