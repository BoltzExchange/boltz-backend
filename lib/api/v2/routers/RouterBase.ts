import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { errorResponse } from '../../Utils';

abstract class RouterBase {
  public readonly path: string;

  protected constructor(
    protected readonly logger: Logger,
    path: string,
  ) {
    this.path = path;
  }

  /**
   * @openapi
   * components:
   *   schemas:
   *     ErrorResponse:
   *       type: object
   *       properties:
   *         error:
   *           type: string
   *           required: true
   *           description: Description of the error that caused the request to fail
   */
  public abstract getRouter: () => Router;

  protected handleError = (
    handler: (req: Request, res: Response) => void | Promise<void>,
  ) => {
    return async (req: Request, res: Response) => {
      try {
        await handler(req, res);
      } catch (e) {
        errorResponse(this.logger, req, res, e, 400);
      }
    };
  };
}

export default RouterBase;
