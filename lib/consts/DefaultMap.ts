class DefaultMap<K, V> extends Map<K, V> {
  constructor(
    private readonly valueConstructor: () => V,
    entries?: readonly (readonly [K, V])[] | null,
  ) {
    super(entries);
  }

  public getNoDefault = (key: K): V | undefined => super.get(key);

  public get = (key: K): V => {
    const value = super.get(key);
    if (value !== undefined) {
      return value;
    }

    const newValue = this.valueConstructor();
    this.set(key, newValue);
    return newValue;
  };
}

export default DefaultMap;
