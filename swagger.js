/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const packageJson = require('./package.json');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Boltz API',
      version: packageJson.version,
    },
  },
  apis: [
    './lib/api/v2/routers/InfoRouter.ts',
    './lib/api/v2/routers/SwapRouter.ts',
    './lib/api/v2/routers/LightningRouter.ts',
    './lib/api/v2/routers/ChainRouter.ts',
    './lib/api/v2/routers/QuoteRouter.ts',
    './lib/api/v2/routers/NodesRouter.ts',
    './lib/api/v2/routers/ReferralRouter.ts',
    './lib/api/v2/routers/RouterBase.ts',
    './lib/api/v2/routers/*.ts',
  ],
  failOnErrors: true,
};

const specs = swaggerJsdoc(options);
specs.servers = [
  {
    url: 'https://api.boltz.exchange/v2',
    description: 'Mainnet',
  },
  {
    url: 'https://api.testnet.boltz.exchange/v2',
    description: 'Testnet',
  },
  {
    url: 'http://localhost:9006/v2',
    description: 'Regtest',
  },
];

fs.writeFileSync('swagger-spec.json', JSON.stringify(specs, undefined, 2));
