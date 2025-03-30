import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { mapToObject } from '../../../Utils';
import Service, { NetworkContracts } from '../../../service/Service';
import {
  createdResponse,
  errorResponse,
  successResponse,
  validateRequest,
} from '../../Utils';
import RouterBase from './RouterBase';

class ChainRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, 'chain');
  }

  public getRouter = () => {
    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Chain
     *   description: Onchain data related endpoints
     */

    /**
     * @openapi
     * /chain/fees:
     *   get:
     *     description: Fee estimations for all supported chains
     *     tags: [Chain]
     *     responses:
     *       '200':
     *         description: Object of currency of chain -> fee estimation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: number
     *                 description: Fee estimation in sat/vbyte or GWEI
     *             examples:
     *               json:
     *                 value: '{"BTC":19,"L-BTC":0.11}'
     */
    router.get('/fees', this.handleError(this.getFees));

    /**
     * @openapi
     * /chain/heights:
     *   get:
     *     description: Block heights for all supported chains
     *     tags: [Chain]
     *     responses:
     *       '200':
     *         description: Object of currency of chain -> block height
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: number
     *                 description: Block height of the chain
     *             examples:
     *               json:
     *                 value: '{"BTC":830311,"L-BTC":2725579}'
     */
    router.get('/heights', this.handleError(this.getHeights));

    /**
     * @openapi
     * components:
     *   schemas:
     *     Contracts:
     *       type: object
     *       required: ["network", "swapContracts", "tokens"]
     *       properties:
     *         network:
     *           type: object
     *           description: Information about the network
     *           required: ["chainId", "name"]
     *           properties:
     *             chainId:
     *               type: number
     *               description: ID of the chain
     *             name:
     *               type: string
     *               description: Name of the chain if applicable
     *         swapContracts:
     *           type: object
     *           description: Mapping of the names of swap contracts to their address
     *           properties:
     *             EtherSwap:
     *               type: string
     *               description: Address of the EtherSwap contract
     *             ERC20Swap:
     *               type: string
     *               description: Address of the ERC20 contract
     *         tokens:
     *           type: object
     *           description: Mapping of the symbol of tokens to their address
     *           additionalProperties:
     *             type: string
     *             description: Address of the token
     */

    /**
     * @openapi
     * /chain/contracts:
     *   get:
     *     tags: [Chain]
     *     description: Get the network information and contract addresses for all supported EVM chains
     *     responses:
     *       '200':
     *         description: Network details and contract addresses on the chain
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 $ref: '#/components/schemas/Contracts'
     *             examples:
     *               json:
     *                 value: '{"rsk":{"network":{"chainId":31337},"tokens":{"USDT":"0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"},"swapContracts":{"EtherSwap":"0x5FbDB2315678afecb367f032d93F642f64180aa3","ERC20Swap":"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"}}}'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/contracts', this.handleError(this.getContracts));

    /**
     * @openapi
     * /chain/{currency}/fee:
     *   get:
     *     description: Fee estimations for a chain
     *     tags: [Chain]
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to get a fee estimation for
     *     responses:
     *       '200':
     *         description: Object containing the fee estimation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["fee"]
     *               properties:
     *                 fee:
     *                   type: number
     *                   description: Fee estimation in sat/vbyte or GWEI
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:currency/fee', this.handleError(this.getFeeForChain));

    /**
     * @openapi
     * /chain/{currency}/height:
     *   get:
     *     description: Block height for a chain
     *     tags: [Chain]
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to get the block height for
     *     responses:
     *       '200':
     *         description: Object containing the block height
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["height"]
     *               properties:
     *                 height:
     *                   type: number
     *                   description: Block height of the chain
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:currency/height', this.handleError(this.getHeightForChain));

    /**
     * @openapi
     * /chain/{currency}/transaction/{id}:
     *   get:
     *     tags: [Chain]
     *     description: Fetch a raw transaction by its id
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to query for
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Id of the transaction to query
     *     responses:
     *       '200':
     *         description: Raw transaction
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["hex"]
     *               properties:
     *                 hex:
     *                   type: string
     *                   description: The transaction encoded as HEX
     *                 confirmations:
     *                   type: number
     *                   description: Number of confirmations the transaction has; not set if not confirmed yet
     *       '400':
     *         description: Error that caused the query for the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/:currency/transaction/:id',
      this.handleError(this.getTransaction),
    );

    /**
     * @openapi
     * /chain/{currency}/transaction:
     *   post:
     *     tags: [Chain]
     *     description: Broadcast a transaction
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to broadcast on
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ["hex"]
     *             properties:
     *               hex:
     *                 type: string
     *                 description: The transaction to broadcast as raw HEX
     *     responses:
     *       '201':
     *         description: ID of the broadcast transaction
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["id"]
     *               properties:
     *                 id:
     *                   type: string
     *                   description: ID of the broadcast transaction
     *       '400':
     *         description: Error that caused the broadcast of the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/:currency/transaction',
      this.handleError(this.postTransaction),
    );

    /**
     * @openapi
     * /chain/{currency}/contracts:
     *   get:
     *     tags: [Chain]
     *     description: Get the network information and contract addresses for a supported EVM chains
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to query for
     *     responses:
     *       '200':
     *         description: Raw transaction
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contracts'
     *             examples:
     *               json:
     *                 value: '{"network":{"chainId":31337},"tokens":{"USDT":"0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"},"swapContracts":{"EtherSwap":"0x5FbDB2315678afecb367f032d93F642f64180aa3","ERC20Swap":"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"}}'
     *       '400':
     *         description: Error that caused the query for the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       '404':
     *         description: Error when the currency is not on an EVM chain
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/:currency/contracts',
      this.handleError(this.getContractsForCurrency),
    );

    return router;
  };

  private getFees = async (_: Request, res: Response) =>
    successResponse(res, mapToObject(await this.service.getFeeEstimation()));

  private getHeights = async (_: Request, res: Response) =>
    successResponse(res, mapToObject(await this.service.getBlockHeights()));

  private getContracts = async (_: Request, res: Response) => {
    const contracts: Record<string, any> = {};
    Object.entries(await this.service.getContracts()).forEach(
      ([key, value]) => {
        contracts[key] = this.formatContracts(value);
      },
    );

    successResponse(res, contracts);
  };

  private getFeeForChain = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    successResponse(res, {
      fee: (await this.service.getFeeEstimation(currency)).get(currency),
    });
  };

  private getHeightForChain = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    successResponse(res, {
      height: (await this.service.getBlockHeights(currency)).get(currency),
    });
  };

  private getTransaction = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const tx = await this.service.getTransaction(currency, id);
    successResponse(res, { hex: tx.hex, confirmations: tx.confirmations });
  };

  private postTransaction = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const { hex } = validateRequest(req.body, [
      { name: 'hex', type: 'string' },
    ]);

    const id = await this.service.broadcastTransaction(currency, hex);
    createdResponse(res, { id });
  };

  private getContractsForCurrency = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const manager = this.service.walletManager.ethereumManagers.find(
      (manager) => manager.hasSymbol(currency),
    );

    if (manager === undefined) {
      errorResponse(
        this.logger,
        req,
        res,
        'chain does not have contracts',
        404,
      );
      return;
    }

    successResponse(
      res,
      this.formatContracts(await manager.getContractDetails()),
    );
  };

  private getCurrencyFromPath = (req: Request): string =>
    validateRequest(req.params, [{ name: 'currency', type: 'string' }])
      .currency;

  private formatContracts = (contracts: NetworkContracts) => ({
    network: contracts.network,
    tokens: mapToObject(contracts.tokens),
    swapContracts: mapToObject(contracts.swapContracts),
  });
}

export default ChainRouter;
