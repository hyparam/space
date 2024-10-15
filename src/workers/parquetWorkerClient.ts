import ParquetWorker from './parquetWorker?worker'
import type { Message, ParquetReadWorkerOptions, Row } from './types.ts'

let worker: Worker | undefined
/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a FileContent, because it needs
 * to be serialized to the worker.
 */
export function parquetQueryWorker({
  metadata, asyncBuffer, rowStart, rowEnd, orderBy }: ParquetReadWorkerOptions
): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    // Create a worker
    if (!worker) {
      worker = new ParquetWorker()
    }
    worker.onmessage = ({ data }: { data: Message }) => {
      // Convert postmessage data to callbacks
      if ("error" in data) {
        reject(data.error)
      } else if ("result" in data) {
        resolve(data.result)
      } else {
        reject(new Error('Unexpected message from worker'))
      }
    }
    worker.postMessage({ metadata, asyncBuffer, rowStart, rowEnd, orderBy })
  })
}