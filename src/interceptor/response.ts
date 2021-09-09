export interface IResponseInterceptor<IConfig, IData, IErr> {
  use(
    success: onSuccess<IConfig, IData>, // on success
    error: onError<IConfig, IData, IErr> // on error
  ): () => void;

  // runSuccess<T>(config: IConfig, response: Response, data: IData): Promise<T | IData>;
  // runError<T>(config: IConfig, err: IErr): Promise<T | IData>;
}

type onSuccess<IConfig, IData> = (config: IConfig, response: Response, data: IData) => Promise<IData>;
type onError<IConfig, IData, IErr> = (config: IConfig, Error: IErr) => Promise<IData>;

export class ResponseInterceptor<IConfig, IData, IErr> implements IResponseInterceptor<IConfig, IData, IErr> {
  private fnsSuccess: onSuccess<IConfig, IData>[] = [];
  private fnsError: onError<IConfig, IData, IErr>[] = [];

  public use(successFn: onSuccess<IConfig, IData>, errorFn: onError<IConfig, IData, IErr>) {
    this.fnsSuccess.push(successFn);
    this.fnsError.push(errorFn);

    return () => {
      const successIndex = this.fnsSuccess.findIndex((v) => v === successFn);
      const errorIndex = this.fnsError.findIndex((v) => v === errorFn);

      if (successIndex > -1) {
        this.fnsSuccess.splice(successIndex, 1);
      }

      if (errorIndex > -1) {
        this.fnsError.splice(errorIndex, 1);
      }
    };
  }

  async runSuccess<T>(config: IConfig, response: Response, data: IData): Promise<T | IData> {
    for (const fn of this.fnsSuccess) {
      data = await fn(config, response, data);
    }

    return data;
  }

  async runError<T>(config: IConfig, err: IErr): Promise<T | IData> {
    let res!: T | IData;

    for (const fn of this.fnsError) {
      res = await fn(config, err);
    }

    return res;
  }
}
