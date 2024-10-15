import type { DataFrame } from 'hightable'
import { AsyncBuffer, FileMetaData, parquetSchema } from 'hyparquet'
import { readableStreamToArrayBuffer } from './streamConverters.ts'
import { parquetQueryWorker } from './workers/parquetWorkerClient.ts'
import type { AsyncBufferFrom } from './workers/types.ts'

/**
 * Convert a parquet file into a dataframe.
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData): DataFrame {
  const { children } = parquetSchema(metadata)
  return {
    header: children.map(child => child.element.name),
    numRows: Number(metadata.num_rows),
    rows(rowStart: number, rowEnd: number, orderBy?: string) {
      return parquetQueryWorker({ asyncBuffer: from, rowStart, rowEnd, orderBy })
    },
    sortable: true,
  }
}

export async function asyncBufferFrom(url: string): Promise<AsyncBuffer> {
  // get byteLength with head
  const res = await fetch(url, { method: 'HEAD' })
  if (!res.ok) throw new Error(`Failed to fetch parquet file: ${res.statusText}`)
  const contentLength = res.headers.get('Content-Length')
  if (!contentLength) throw new Error('Content-Length header missing')
  const byteLength = Number(contentLength)

  // slice with range requests
  return {
    byteLength,
    slice: async (start: number, end?: number) => {
      const headers = new Headers({ Range: rangeString(start, end) })
      const res = await fetch(url, { headers })
      if (!res.ok || !res.body) throw new Error(`Failed to fetch parquet file: ${res.statusText}`)
      return readableStreamToArrayBuffer(res.body)
    },
  }
}


/**
 * Convert a start and end byte offset into a range string.
 * If start is negative, end must be undefined.
 */
export function rangeString(start: number, end?: number): string {
  if (start < 0) {
    if (end !== undefined) throw new Error(`invalid suffix range [${start.toString()}, ${end.toString()}]`)
    return `bytes=${start.toString()}`
  } else if (end !== undefined) {
    if (start >= end) throw new Error(`invalid empty range [${start.toString()}, ${end.toString()}]`)
    return `bytes=${start.toString()}-${(end - 1).toString()}`
  } else {
    return `bytes=${start.toString()}-`
  }
}
