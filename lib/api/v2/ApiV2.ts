import { Application } from 'express';
import Logger from '../../Logger';
import Service from '../../service/Service';
import Controller from '../Controller';
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
    service: Service,
    controller: Controller,
  ) {
    this.routers = [
      new InfoRouter(this.logger, service),
      new SwapRouter(this.logger, service, controller),
      new ChainRouter(this.logger, service),
      new NodesRouter(this.logger, service),
    ];
  }

  public registerRoutes = (app: Application) => {
    this.routers.forEach((router) =>
      app.use(`${apiPrefix}/${router.path}`, router.getRouter()),
    );
  };
}

export default ApiV2;
