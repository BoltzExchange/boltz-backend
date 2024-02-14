import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { getVersion } from '../../../Utils';
import Service from '../../../service/Service';
import { successResponse } from '../../Utils';
import RouterBase from './RouterBase';

class InfoRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, '');
  }

  public getRouter = () => {
    /**
     * @openapi
     * tags:
     *   name: Info
     *   description: General information
     */

    const router = Router();

    /**
     * @openapi
     * /version:
     *   get:
     *     description: Version of the backend
     *     tags: [Info]
     *     responses:
     *       '200':
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 version:
     *                   type: string
     *                   required: true
     */
    router.get('/version', this.handleError(this.getVersion));

    /**
     * @openapi
     * /infos:
     *   get:
     *     description: Information about the configuration of the backend
     *     tags: [Info]
     *     responses:
     *       '200':
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: string
     */
    router.get('/infos', this.handleError(this.getInfos));

    /**
     * @openapi
     * /warnings:
     *   get:
     *     description: Warnings about the configuration of the backend
     *     tags: [Info]
     *     responses:
     *       '200':
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: string
     */
    router.get('/warnings', this.handleError(this.getWarnings));

    return router;
  };

  private getVersion = (_req: Request, res: Response) =>
    successResponse(res, {
      version: getVersion(),
    });

  private getInfos = (_req: Request, res: Response) =>
    successResponse(res, this.service.getInfos());

  private getWarnings = (_req: Request, res: Response) =>
    successResponse(res, this.service.getWarnings());
}

export default InfoRouter;
