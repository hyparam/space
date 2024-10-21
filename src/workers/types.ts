import { ColumnData, ParquetReadOptions } from 'hyparquet'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFrom {
  url: string
  byteLength: number
}
// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
export interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'file'> {
  asyncBuffer: AsyncBufferFrom
  orderBy?: string // column to sort by
}
// Row is defined in hightable, but not exported + we change any to unknown
export type Row = Record<string, unknown>;

export type Message = ({
  result: Row[]
} | {
  chunk: ColumnData
} | {
  error: Error
}) & {
  queryId: number
}