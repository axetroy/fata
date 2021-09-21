import { FataFormData, FataURLSearchParams } from "./form";
import { IFataError, FataError } from "./error";
import { IRequestInterceptor, RequestInterceptor } from "./interceptor/request";
import { IResponseInterceptor, ResponseInterceptor } from "./interceptor/response";
import { timeoutIt } from "./util";

interface Stringable {
  toString(): string;
}

interface IFataHeaderMapString {
  [key: string]: string;
}

type IMethod = "GET" | "POST" | "DELETE" | "PUT" | "HEAD" | "OPTIONS" | "TRACE" | "PATCH";

interface IFataHeaderConfig {
  common: IFataHeaderMapString;
  GET: IFataHeaderMapString;
  POST: IFataHeaderMapString;
  DELETE: IFataHeaderMapString;
  PUT: IFataHeaderMapString;
  HEAD: IFataHeaderMapString;
  OPTIONS: IFataHeaderMapString;
  TRACE: IFataHeaderMapString;
  PATCH: IFataHeaderMapString;
}

interface IFataRequestCommonOptions extends Omit<RequestInit, "body" | "method"> {
  path?: {
    [key: string]: Stringable;
  };
  query?: {
    [key: string]: Stringable;
  };
  header?: {
    [key: string]: Stringable;
  };
  body?: BodyInit | null | FataFormData | FataURLSearchParams;
  timeout?: number;
  transformer?: Transformer;
}

export interface IFataRequestOptions extends IFataRequestCommonOptions {
  url: string | URL;
  method: IMethod;
}

type Transformer = (resp: Response) => Promise<unknown>;

export interface IFata {
  readonly interceptors: {
    readonly request: IRequestInterceptor<IFataRequestOptions>;
    readonly response: IResponseInterceptor<IFataRequestOptions, unknown, IFataError>;
  };
  readonly defaults: { readonly timeout: number; readonly headers: IFataHeaderConfig };
  readonly baseURL: string;
  request<T>(config: IFataRequestOptions): Promise<T>;
  get<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  post<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  put<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  delete<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  options<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  head<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  trace<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
  patch<T>(url: string, config?: IFataRequestCommonOptions): Promise<T>;
}
export class Fata implements IFata {
  /**
   * @param { string } _baseURL the client base url. eg. http://example.com/api
   */
  constructor(private _baseURL?: string) {}

  private _requestInterceptor = new RequestInterceptor<IFataRequestOptions>();
  private _responseInterceptor = new ResponseInterceptor<IFataRequestOptions, unknown, IFataError>();

  private _defaults: {
    timeout: number;
    headers: IFataHeaderConfig;
  } = {
    timeout: 60 * 1000, // 60s,
    headers: {
      common: { "Content-Type": "application/json;utf-8" },
      GET: {},
      POST: {},
      DELETE: {},
      PUT: {},
      HEAD: {},
      OPTIONS: {},
      TRACE: {},
      PATCH: {},
    },
  };

  /**
   * response transformer
   * @param resp
   * @returns
   */
  private async _transformer(resp: Response): Promise<unknown> {
    const contentType = resp.headers.get("content-type");
    switch (contentType) {
      case "application/json":
        return { data: await resp.json(), resp };
      case "application/x-www-form-urlencoded":
        return { data: await resp.formData(), resp };
      case "application/octet-stream":
        return { data: await resp.blob(), resp };
      default:
        return { data: await resp.text(), resp };
    }
  }

  public get interceptors() {
    const self = this;
    return {
      get request() {
        return self._requestInterceptor as IRequestInterceptor<IFataRequestOptions>;
      },
      get response() {
        return self._responseInterceptor as IResponseInterceptor<IFataRequestOptions, unknown, IFataError>;
      },
      set transformer(fn: Transformer) {
        self._transformer = fn;
      },
    };
  }

  public get defaults() {
    return this._defaults;
  }

  public get baseURL(): string {
    return this._baseURL || "";
  }

  public set baseURL(baseURL: string) {
    this._baseURL = baseURL;
  }

  public async request<T>(config: IFataRequestOptions): Promise<T> {
    const url = config.url instanceof URL ? config.url : new URL(`${this.baseURL.replace(/\/+$/, "")}/${config.url.replace(/^\/+/, "")}`);
    config.header = config.header || {};

    const defaults = this.defaults;

    // set default header
    for (const key in defaults.headers.common) {
      config.header[key] = defaults.headers.common[key];
    }

    // set header for this method
    for (const key in defaults.headers[config.method] || {}) {
      config.header[key] = defaults.headers[config.method][key];
    }

    if (config.query) {
      for (const key in config.query) {
        const value = config.query[key];
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      }
    }

    if (config.path) {
      for (const key in config.path) {
        const t1 = encodeURI("{");
        const t2 = encodeURI("}");
        const reg = new RegExp(`${t1}${key}${t2}`, "g");
        url.pathname = url.pathname.replace(reg, config.path[key].toString());
      }
    }

    config = await this._requestInterceptor.exec(config).catch((err) => Promise.reject(FataError.fromError(err)));

    const headers = new Headers();

    for (const key in config.header) {
      const value = config.header[key];
      if (value !== undefined) {
        headers.set(key, value.toString());
      }
    }

    const timeout = config.timeout || defaults.timeout;
    let contentType = headers.get("Content-Type");
    let body: any = null;

    const typeofBody = typeof config.body;

    if (config.body === undefined || config.body === null || ["GET", "HEAD"].indexOf(config.method.toUpperCase()) > -1) {
      contentType = "text/xml;charset=UTF-8";
    } else if (config.body instanceof FormData) {
      contentType = "multipart/form-data";
      body = config.body instanceof FataFormData ? config.body.formData() : config.body;
    } else if (config.body instanceof URLSearchParams) {
      contentType = "application/x-www-form-urlencoded;charset=UTF-8";
      body = config.body instanceof FataURLSearchParams ? config.body.URLSearchParams() : config.body;
    } else if (typeof ReadableStream !== "undefined" && config.body instanceof ReadableStream) {
      body = config.body;
    } else if (config.body instanceof Blob) {
      body = config.body;
    } else if (typeof ArrayBuffer !== "undefined" && config.body instanceof ArrayBuffer) {
      body = config.body;
    } else if (typeofBody === "object") {
      contentType = "application/json;charset=UTF-8";
      body = JSON.stringify(config.body);
    } else if (typeofBody === "string" || typeofBody === "boolean" || typeofBody === "number") {
      contentType = "text/xml;charset=UTF-8";
      body = config.body;
    } else {
      contentType = "text/xml;charset=UTF-8";
      body = config.body;
    }

    if (contentType) {
      headers.delete("Content-Type");
      headers.set("Content-Type", contentType);
    }

    const exec = () =>
      fetch(url.toString(), {
        method: config.method,
        body: body,
        headers: headers,

        // common options
        cache: config.cache,
        credentials: config.credentials,
        integrity: config.integrity,
        keepalive: config.keepalive,
        mode: config.mode,
        redirect: config.redirect,
        referrer: config.referrer,
        referrerPolicy: config.referrerPolicy,
        signal: config.signal,
        window: config.window,
      });

    return (timeout ? timeoutIt(timeout, exec()) : exec())
      .then(async (resp) => {
        if (!resp.ok) return Promise.reject(FataError.fromResponse(resp));
        return typeof config.transformer === "function" ? config.transformer(resp) : this._transformer(resp);
      })
      .then(({ data, resp }) => {
        return this._responseInterceptor.runSuccess(config, resp, data) as Promise<T>;
      })
      .catch((err) => {
        const runtimeErr = err instanceof FataError ? err : err instanceof Error ? FataError.fromError(err) : new FataError(err + "");

        return this._responseInterceptor.runError<T>(config, runtimeErr) as Promise<T>;
      })
      .catch((err) => {
        return Promise.reject(FataError.fromError(err));
      });
  }

  public async get<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "GET", ...config });
  }

  public async post<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "POST", ...config });
  }

  public async put<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "PUT", ...config });
  }

  public async delete<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "DELETE", ...config });
  }

  public async head<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "HEAD", ...config });
  }

  public async options<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "OPTIONS", ...config });
  }

  public async trace<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "TRACE", ...config });
  }

  public async patch<T>(url: string, config: IFataRequestCommonOptions = {}): Promise<T> {
    return this.request<T>({ url, method: "PATCH", ...config });
  }
}

export default Fata;
