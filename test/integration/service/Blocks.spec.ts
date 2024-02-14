import http from 'http';
import Logger from '../../../lib/Logger';
import Blocks from '../../../lib/service/Blocks';

describe('Blocks', () => {
  const addresses = ['bc1', '123'];

  const server = http.createServer((_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(addresses));
  });

  let blocks: Blocks;

  beforeAll(async () => {
    const port = await new Promise((resolve) => {
      server.listen(0, () => {
        resolve((server.address()! as any).port);
      });
    });

    blocks = new Blocks(Logger.disabledLogger, {
      urls: [`http://127.0.0.1:${port}`],
    });
  });

  afterAll(() => {
    server.close();
  });

  test('should update blocks', async () => {
    expect(blocks['blocked'].size).toEqual(0);
    await blocks.updateBlocks();

    expect(blocks['blocked'].size).toEqual(addresses.length);
  });

  test.each`
    address         | blocked
    ${addresses[0]} | ${true}
    ${addresses[1]} | ${true}
    ${'notBlocked'} | ${false}
  `('should check if address $address is blocked', ({ address, blocked }) => {
    expect(blocks.isBlocked(address)).toEqual(blocked);
  });
});
