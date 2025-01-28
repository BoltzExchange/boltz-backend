/*
 * The API is implemented in the sidecar
 */

/**
 * @openapi
 * tags:
 *   name: Lightning
 *   description: Lightning related endpoints
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     LightningNode:
 *       type: object
 *       required: ["id"]
 *       properties:
 *         id:
 *           type: string
 *           description: Public key of the node
 *         alias:
 *           type: string
 *           description: Alias of the node
 *         color:
 *           type: string
 *           description: Color code the node
 *
 *     LightningChannelInfo:
 *       type: object
 *       required: ["baseFeeMillisatoshi", "feePpm", "delay"]
 *       properties:
 *         baseFeeMillisatoshi:
 *           type: number
 *           description: Base fee of the channel in millisatoshi
 *         feePpm:
 *           type: number
 *           description: Parts per million fee of the channel
 *         delay:
 *           type: number
 *           description: CLTV delay of the channel in blocks
 *         htlcMinimumMillisatoshi:
 *           type: number
 *           description: Minimum allowed HTLC value in millisatoshi
 *         htlcMaximumMillisatoshi:
 *           type: number
 *           description: Maximum allowed HTLC value in millisatoshi
 *
 *     LightningChannel:
 *       type: object
 *       required: ["source", "shortChannelId"]
 *       properties:
 *         source:
 *           $ref: '#/components/schemas/LightningNode'
 *         shortChannelId:
 *           type: string
 *           description: ID of the channel
 *         capacity:
 *           type: number
 *           description: Capacity of the channel in satoshi
 *         active:
 *           type: boolean
 *           description: Whether the channel can be used
 *         info:
 *           $ref: '#/components/schemas/LightningChannelInfo'
 */

/**
 * @openapi
 * /lightning/{currency}/node/{node}:
 *   get:
 *     tags: [Lightning]
 *     description: Gets information about a lightning node
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency of the lightning network to use
 *       - in: path
 *         name: node
 *         required: true
 *         schema:
 *           type: string
 *         description: Public key of the node to get information for
 *     responses:
 *       '200':
 *         description: Information about the lightning node
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LightningNode'
 *       '400':
 *         description: Unprocessable acceptable request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the node cannot be found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /lightning/{currency}/channels/{node}:
 *   get:
 *     tags: [Lightning]
 *     description: Gets the channels of a lightning node
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency of the lightning network to use
 *       - in: path
 *         name: node
 *         required: true
 *         schema:
 *           type: string
 *         description: Public key of the node to get channels for
 *     responses:
 *       '200':
 *         description: Channels of the lightning node
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LightningChannel'
 *       '400':
 *         description: Unprocessable acceptable request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the node cannot be found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /lightning/{currency}/bolt12/fetch:
 *   post:
 *     tags: [Lightning]
 *     description: Fetches an invoice for a BOLT12 offer
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency of the lightning network to use
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["offer", "amount"]
 *             properties:
 *               offer:
 *                 type: string
 *                 description: A BOLT12 offer
 *               amount:
 *                 type: number
 *                 description: Amount of the invoice that should be fetched in satoshis
 *     responses:
 *       '201':
 *         description: BOLT12 invoice fetched from the offer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: ["invoice"]
 *               properties:
 *                 invoice:
 *                   type: string
 *                   description: A BOLT12 invoice
 *       '404':
 *         description: When the currency has no BOLT12 support
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: When no invoice could be fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
