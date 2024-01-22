import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import Service from '../../../service/Service';
import { successResponse } from '../../Utils';
import RouterBase from './RouterBase';

class NodesRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, 'nodes');
  }

  public getRouter = () => {
    /**
     * @openapi
     * tags:
     *   name: Nodes
     *   description: Lightning nodes
     */

    const router = Router();

    /**
     * @openapi
     * components:
     *   schemas:
     *     NodeInfo:
     *       type: object
     *       properties:
     *         publicKey:
     *           type: string
     *         uris:
     *           type: array
     *           items:
     *             type: string
     */

    /**
     * @openapi
     * /nodes:
     *   get:
     *     description: Information about the Lightning nodes the backend is connected to
     *     tags: [Nodes]
     *     responses:
     *       '200':
     *         description: Lightning node information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: object
     *                 additionalProperties:
     *                   $ref: '#/components/schemas/NodeInfo'
     */
    router.get('/', this.handleError(this.getNodes));

    /**
     * @openapi
     * components:
     *   schemas:
     *     NodeStats:
     *       type: object
     *       properties:
     *         capacity:
     *           type: integer
     *         channels:
     *           type: integer
     *         peers:
     *           type: integer
     *         oldestChannel:
     *           type: integer
     *           description: UNIX timestamp of the block in which the funding transaction of the oldest channel was included
     */

    /**
     * @openapi
     * /nodes/stats:
     *   get:
     *     description: Statistics about the Lightning nodes the backend is connected to
     *     tags: [Nodes]
     *     responses:
     *       '200':
     *         description: Statistics about Lightning nodes
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: object
     *                 properties:
     *                   total:
     *                     $ref: '#/components/schemas/NodeStats'
     *                 additionalProperties:
     *                   $ref: '#/components/schemas/NodeStats'
     */
    router.get('/stats', this.handleError(this.getNodeStats));

    return router;
  };

  private getNodes = (_req: Request, res: Response) => {
    const result = Object.fromEntries(
      Array.from(this.service.getNodes().entries()).map(
        ([symbol, nodeInfo]) => {
          return [
            symbol,
            Object.fromEntries(
              Array.from(nodeInfo.entries()).map(([name, info]) => {
                return [
                  name,
                  {
                    publicKey: info.nodeKey,
                    uris: info.uris,
                  },
                ];
              }),
            ),
          ];
        },
      ),
    );

    successResponse(res, result);
  };

  private getNodeStats = (_req: Request, res: Response) => {
    const stats = Object.fromEntries(
      Array.from(this.service.getNodeStats().entries()).map(
        ([symbol, stats]) => [symbol, Object.fromEntries(stats.entries())],
      ),
    );

    successResponse(res, stats);
  };
}

export default NodesRouter;
