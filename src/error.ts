export interface IFataError extends Error {
  response?: Response;
}

export class FataError extends Error implements IFataError {
  constructor(message: string, private _resp?: Response) {
    super(message);
  }

  public get response(): Response | undefined {
    return this._resp;
  }

  static fromResponse(resp: Response): IFataError {
    return new FataError(resp.statusText, resp);
  }

  static fromError(err: Error): IFataError {
    if (err instanceof FataError) return err;
    return new FataError(err.message || "unknown error: " + err);
  }
}
