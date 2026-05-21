import { isMethodAllowed } from '../../../../lib/grpc/interceptors/AuthInterceptor';

describe('isMethodAllowed', () => {
  const m = '/boltzrpc.Boltz/GetInfo';

  test.each([
    [m, ['*'], true],
    [m, ['/boltzrpc.Boltz/*'], true],
    [m, [m], true],
    [m, ['/boltzrpc.Boltz/Stop', m], true],
    [m, ['/boltzrpc.Boltz/Stop'], false],
    [m, ['/boltzrpc.Other/*'], false],
    [m, [], false],
    [m, [''], false],
    ['/boltzrpc.Boltz/Stop', ['/boltzrpc.Boltz/*'], true],
    ['/other.Service/Foo', ['/boltzrpc.Boltz/*'], false],
  ])('isMethodAllowed(%s, %j) -> %s', (method, allowed, expected) => {
    expect(isMethodAllowed(method, allowed)).toBe(expected);
  });
});
