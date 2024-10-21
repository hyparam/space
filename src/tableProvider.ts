import type { DataFrame } from 'hightable'
import { FileMetaData, parquetSchema } from 'hyparquet'
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
