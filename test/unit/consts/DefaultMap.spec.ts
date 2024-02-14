import DefaultMap from '../../../lib/consts/DefaultMap';

describe('DefaultMap', () => {
  test('should construct with entries', () => {
    const entries: [number, string][] = [
      [1, 'test'],
      [2, 'test2'],
    ];
    const map = new DefaultMap<number, string>(() => '', entries);

    expect(Array.from(map.entries())).toEqual(entries);
  });

  test('should get default value', () => {
    const map = new DefaultMap<number, string>(() => 'default');
    expect(map.get(1)).toEqual('default');
    expect(map.size).toEqual(1);
  });

  test('should get set value', () => {
    const map = new DefaultMap<number, string>(
      () => 'default',
      [[1, 'not default']],
    );
    expect(map.get(1)).toEqual('not default');
  });

  test('should get with no default value', () => {
    const map = new DefaultMap<number, string>(() => 'default');
    expect(map.getNoDefault(1)).toBeUndefined();
  });
});
