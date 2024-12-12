import EventEmitter from 'events';

type EmittedEvents = Record<string | symbol, (...args: any) => any>;

export declare interface TypedEventEmitter<Events extends EmittedEvents> {
  on<E extends keyof Events>(event: E, listener: Events[E]): this;

  emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class TypedEventEmitter<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Events extends EmittedEvents
> extends EventEmitter {}
