import { EventEmitter } from 'events';

class TypedEventEmitter<
  T extends Record<string | symbol, any>,
> extends EventEmitter {
  public on = <K extends keyof T>(
    event: K,
    listener: (arg: T[K]) => void,
  ): this => super.on(event as string | symbol, listener);

  public once = <K extends keyof T>(
    event: K,
    listener: (arg: T[K]) => void,
  ): this => super.once(event as string | symbol, listener);

  public emit = <K extends keyof T>(event: K, arg: T[K]): boolean =>
    super.emit(event as string | symbol, arg);

  public removeListener = <K extends keyof T>(
    event: K,
    listener: (arg: T[K]) => void,
  ): this => super.removeListener(event as string | symbol, listener);
}

export default TypedEventEmitter;
