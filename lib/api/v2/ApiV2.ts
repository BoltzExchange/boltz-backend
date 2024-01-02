import { Application } from 'express';
import Logger from '../../Logger';
import Service from '../../service/Service';
import { apiPrefix } from './Consts';
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
      new NodesRouter(this.logger, this.service),
      new SwapRouter(this.logger, this.service),
    ];
  }

  public registerRoutes = (app: Application) => {
    this.routers.forEach((router) =>
      app.use(`${apiPrefix}/${router.path}`, router.getRouter()),
    );
  };
}

export default ApiV2;
