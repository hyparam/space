import { FileMetaData } from 'hyparquet'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFrom {
  url: string
  byteLength: number
}
// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
export interface ParquetReadWorkerOptions {
  asyncBuffer: AsyncBufferFrom
  metadata?: FileMetaData // parquet metadata, will be parsed if not provided
  columns?: number[] // columns to read, all columns if undefined
  rowStart?: number // inclusive
  rowEnd?: number // exclusive
  orderBy?: string // column to sort by
}
// Row is defined in hightable, but not exported + we change any to unknown
export type Row = Record<string, unknown>;

export type Message = ({
  result: Row[]
} | {
  error: Error
}) & {
  queryId: number
}