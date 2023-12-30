import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { apiPrefix } from '../Consts';
import { errorResponse } from '../../Utils';

abstract class RouterBase {
  public readonly path: string;

  protected constructor(
    private logger: Logger,
    path: string,
  ) {
    this.path = path;
  }

  public abstract getRouter: () => Router;

  protected handleError = (
    handler: (req: Request, res: Response) => void | Promise<void>,
  ) => {
    return async (req: Request, res: Response) => {
      try {
        await handler(req, res);
      } catch (e) {
        errorResponse(
          this.logger,
          req,
          res,
          e,
          400,
          `${apiPrefix}/${this.path}`,
        );
      }
    };
  };
}

export default RouterBase;
