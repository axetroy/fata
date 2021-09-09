import { FetaError } from "../error";
import type { IFetaRequestOptions } from "../fetest";

export function request<T>(config: IFetaRequestOptions): Promise<T> {
  return fetch(config.url.toString(), {
    method: config.method,
    body: config.body,
    headers: config.headers,

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
  }).then(async (resp) => {
    if (!resp.ok) return Promise.reject(FetaError.fromResponse(resp));
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
  }) as Promise<T>;
}
