import { NextRequest } from "next/server";
import { ReadableStream } from "node:stream/web";

interface MockRequestOptions {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  ip?: string;
  searchParams?: URLSearchParams | Record<string, string | string[]>;
}

function buildUrl(baseUrl: string, searchParams?: MockRequestOptions["searchParams"]) {
  if (!searchParams) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  const params =
    searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams as Record<string, string>);
  params.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export function createNextRequest({
  url = "http://localhost/api/test",
  method = "GET",
  headers = {},
  body,
  ip,
  searchParams,
}: MockRequestOptions = {}) {
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
  const request = new Request(buildUrl(url, searchParams), {
    method,
    headers,
    body: serializedBody,
  });

  const nextRequest = new NextRequest(request);
  if (ip) {
    Object.defineProperty(nextRequest, "ip", {
      value: ip,
      configurable: true,
    });
  }

  if (body !== undefined) {
    Object.defineProperty(nextRequest, "json", {
      value: async () => body,
      configurable: true,
    });
    Object.defineProperty(nextRequest, "text", {
      value: async () => serializedBody ?? "",
      configurable: true,
    });
    Object.defineProperty(nextRequest, "body", {
      value: ReadableStream.from([serializedBody ?? ""]),
      configurable: true,
    });
  }

  return nextRequest;
}
