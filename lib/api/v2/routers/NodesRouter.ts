import type { Request, Response } from 'express';
import { Router } from 'express';
import type Logger from '../../../Logger';
import type Service from '../../../service/Service';
import { successResponse, validateRequest } from '../../Utils';
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
     *       required: ["publicKey", "uris"]
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
     *             examples:
     *               json:
     *                 value: '{"BTC":{"LND":{"publicKey":"026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2","uris":["026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@45.86.229.190:9735","026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@d7kak4gpnbamm3b4ufq54aatgm3alhx3jwmu6kyy2bgjaauinkipz3id.onion:9735"]},"CLN":{"publicKey":"02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018","uris":["02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736","02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@2a10:1fc0:3::270:a9dc:9736","02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@oo5tkbbpgnqjopdjxepyfavx3yemtylgzul67s7zzzxfeeqpde6yr7yd.onion:9736"]}}}'
     */
    router.get('/', this.handleError(this.getNodes));

    /**
     * @openapi
     * components:
     *   schemas:
     *     NodeStats:
     *       type: object
     *       required: ["capacity", "channels", "peers", "oldestChannel"]
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
     *             examples:
     *               json:
     *                 value: '{"BTC":{"LND":{"capacity":5806395450,"channels":1052,"peers":2199,"oldestChannel":1553900632},"CLN":{"capacity":1062157049,"channels":79,"peers":124,"oldestChannel":1692910360},"total":{"capacity":6868552499,"channels":1131,"peers":2323,"oldestChannel":1553900632}}}'
     */
    router.get('/stats', this.handleError(this.getNodeStats));

    router.get(
      '/:currency/:node/hints',
      this.handleError(this.getRoutingHints),
    );

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

  private getRoutingHints = async (req: Request, res: Response) => {
    const { currency, node } = validateRequest(req.params, [
      { name: 'currency', type: 'string' },
      { name: 'node', type: 'string' },
    ]);

    successResponse(
      res,
      await this.service.swapManager.routingHints.getRoutingHints(
        currency,
        node,
      ),
    );
  };
}

export default NodesRouter;
