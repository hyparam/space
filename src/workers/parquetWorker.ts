import { parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import type { ParquetReadWorkerOptions } from './types.ts'
import { asyncBufferFrom } from './parquetWorkerClient.ts'

self.onmessage = async ({ data }: { data: ParquetReadWorkerOptions}) => {
  const { metadata, asyncBuffer, rowStart, rowEnd, orderBy } = data
  const file = await asyncBufferFrom(asyncBuffer)
  try {
    const result = await parquetQuery({
      metadata, file, rowStart, rowEnd, orderBy, compressors,
    })
    self.postMessage({ result })
  } catch (error) {
    self.postMessage({ error })
  }
}