type fn<T> = (config: T) => Promise<T>;

export interface IRequestInterceptor<T> {
  use(fn: (config: T) => Promise<T>): () => void;
  exec(config: T): Promise<T>;
}

export class RequestInterceptor<T> implements IRequestInterceptor<T> {
  private fns: fn<T>[] = [];

  public use(fn: fn<T>) {
    this.fns.push(fn);

    return () => {
      const index = this.fns.findIndex((v) => v === fn);

      if (index > -1) {
        this.fns.splice(index, 1);
      }
    };
  }

  public async exec(config: T): Promise<T> {
    for (const fn of this.fns) {
      config = await fn(config);
    }

    return config;
  }
}
