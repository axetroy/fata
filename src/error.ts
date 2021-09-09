export interface IFetaError extends Error {
  response?: Response;
}

export class FetaError extends Error implements IFetaError {
  constructor(message: string, private _resp?: Response) {
    super(message);
  }

  public get response(): Response | undefined {
    return this._resp;
  }

  static fromResponse(resp: Response): IFetaError {
    return new FetaError(resp.statusText, resp);
  }

  static fromError(err: Error): IFetaError {
    if (err instanceof FetaError) return err;
    return new FetaError(err.message || "unknown error: " + err);
  }
}
