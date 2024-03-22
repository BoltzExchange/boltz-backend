import { Application } from 'express';
import Logger from '../../Logger';
import CountryCodes from '../../service/CountryCodes';
import Service from '../../service/Service';
import SwapInfos from '../SwapInfos';
import { apiPrefix } from './Consts';
import ChainRouter from './routers/ChainRouter';
import InfoRouter from './routers/InfoRouter';
import NodesRouter from './routers/NodesRouter';
import ReferralRouter from './routers/ReferralRouter';
import RouterBase from './routers/RouterBase';
import SwapRouter from './routers/SwapRouter';

class ApiV2 {
  private readonly routers: RouterBase[];

  constructor(
    private readonly logger: Logger,
    service: Service,
    swapInfos: SwapInfos,
    countryCodes: CountryCodes,
  ) {
    this.routers = [
      new InfoRouter(this.logger, service),
      new SwapRouter(this.logger, service, swapInfos, countryCodes),
      new ChainRouter(this.logger, service),
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
