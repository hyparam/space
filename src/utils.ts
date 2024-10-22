import { byteLengthFromUrl, AsyncBuffer } from "hyparquet";

/**
 * Helper function to join class names
 */
export function cn(...names: (string | undefined | false)[]): string {
  return names.filter((n) => n).join(" ");
}

interface AsyncBufferFromUrlOptions {
  url: string;
  byteLength?: number;
  headers?: Record<string, string>;
}

export function setFetchHeaders(
  headers?: Record<string, string>
): typeof fetch {
  return (url, options) => {
    const newOptions = {
      ...options,
      headers: { ...(headers ?? {}), ...options?.headers },
    }
    console.log("newOptions", newOptions)
    return fetch(url, newOptions);
  }
}

export async function asyncBufferFromUrl({
  url,
  byteLength,
  headers: customHeaders,
}: AsyncBufferFromUrlOptions): Promise<AsyncBuffer> {
  // byte length from HEAD request
  byteLength ||= await byteLengthFromUrl(url);
  return {
    byteLength,
    async slice(start, end) {
      // fetch byte range from url
      const headers = new Headers(customHeaders);
      const endStr = end === undefined ? "" : end - 1;
      headers.set("Range", `bytes=${start.toString()}-${endStr.toString()}`);
      const res = await fetch(url, { headers });
      if (!res.ok || !res.body)
        throw new Error(`fetch failed ${res.status.toString()}`);
      return res.arrayBuffer();
    },
  };
}
