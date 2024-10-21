import ParquetWorker from "./parquetWorker?worker";
import type {
  AsyncBufferFrom,
  Message,
  ParquetReadWorkerOptions,
  Row,
} from "./types.ts";
import { asyncBufferFromUrl, AsyncBuffer } from "hyparquet";

let worker: Worker | undefined;
let nextQueryId = 0;
const pending = new Map<
  number,
  { resolve: (value: Row[]) => void; reject: (error: Error) => void }
>();

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker.
 */
export function parquetQueryWorker({
  metadata,
  asyncBuffer,
  rowStart,
  rowEnd,
  orderBy,
  onChunk,
}: ParquetReadWorkerOptions): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++;
    pending.set(queryId, { resolve, reject });
    // Create a worker
    if (!worker) {
      worker = new ParquetWorker();
      worker.onmessage = ({ data }: { data: Message }) => {
        const pendingPromise = pending.get(data.queryId);
        if (!pendingPromise) {
          throw new Error(
            `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`
          );
          // TODO(SL): should never happen. But if it does, I'm not sure if throwing an error here helps.
        }
        const { resolve, reject } = pendingPromise;
        // Convert postmessage data to callbacks
        if ("error" in data) {
          reject(data.error);
        } else if ("result" in data) {
          resolve(data.result);
        } else if ("chunk" in data) {
          onChunk?.(data.chunk);
        } else {
          reject(new Error("Unexpected message from worker"));
        }
      };
    }
    // If caller provided an onChunk callback, worker will send chunks as they are parsed
    const chunks = onChunk !== undefined;
    worker.postMessage({
      queryId,
      metadata,
      asyncBuffer,
      rowStart,
      rowEnd,
      orderBy,
      chunks,
    });
  });
}

/**
 * Convert AsyncBufferFrom to AsyncBuffer and cache results.
 */
export async function asyncBufferFrom(
  from: AsyncBufferFrom
): Promise<AsyncBuffer> {
  const key = JSON.stringify(from);
  const cached = cache.get(key);
  if (cached) return cached;
  const asyncBuffer = asyncBufferFromUrl(from.url, from.byteLength).then(
    cachedAsyncBuffer
  );
  cache.set(key, asyncBuffer);
  return asyncBuffer;
}
const cache = new Map<string, Promise<AsyncBuffer>>();

// TODO(SL): once the types in cachedAsyncBuffer are fixed, import all the following from hyparquet
type Awaitable<T> = T | Promise<T>;

function cachedAsyncBuffer(asyncBuffer: AsyncBuffer): AsyncBuffer {
  const cache = new Map<string, Awaitable<ArrayBuffer>>();
  const byteLength = asyncBuffer.byteLength;
  return {
    byteLength,
    /**
     * @param {number} start
     * @param {number} [end]
     * @returns {Awaitable<ArrayBuffer>}
     */
    slice(start: number, end?: number): Awaitable<ArrayBuffer> {
      const key = cacheKey(start, end, byteLength);
      const cached = cache.get(key);
      if (cached) return cached;
      // cache miss, read from file
      const promise = asyncBuffer.slice(start, end);
      cache.set(key, promise);
      return promise;
    },
  };
}

/**
 * Returns canonical cache key for a byte range 'start,end'.
 * Normalize int-range and suffix-range requests to the same key.
 *
 * @param {number} start start byte of range
 * @param {number} [end] end byte of range, or undefined for suffix range
 * @param {number} [size] size of file, or undefined for suffix range
 * @returns {string}
 */
function cacheKey(start: number, end?: number, size?: number): string {
  if (start < 0) {
    if (end !== undefined)
      throw new Error(
        `invalid suffix range [${start.toString()}, ${end.toString()}]`
      );
    if (size === undefined) return `${start.toString()},`;
    return `${(size + start).toString()},${size.toString()}`;
  } else if (end !== undefined) {
    if (start > end)
      throw new Error(
        `invalid empty range [${start.toString()}, ${end.toString()}]`
      );
    return `${start.toString()},${end.toString()}`;
  } else if (size === undefined) {
    return `${start.toString()},`;
  } else {
    return `${start.toString()},${size.toString()}`;
  }
}
