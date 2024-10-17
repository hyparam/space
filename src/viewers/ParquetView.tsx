import HighTable, { DataFrame, rowCache } from 'hightable'
import { useEffect, useState } from 'react'
import { parquetDataFrame } from '../tableProvider.ts'
import { Spinner } from '../Layout.tsx'
import ContentHeader from './ContentHeader.tsx'
import {
  asyncBufferFromUrl,
  // FileMetaData,
  parquetMetadataAsync } from 'hyparquet'
import { changeQueryString } from '../huggingface.ts'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  url: string
  resolveUrl?: string
  setProgress: (progress: number) => void
  setError: (error: Error) => void
}

interface Content {
  dataframe: DataFrame
  fileSize?: number
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ url, resolveUrl, setProgress, setError }: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()
  // const [metadata, setMetadata] = useState<FileMetaData>() // TODO(SL): use it?

  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.33)
        const sourceUrl = resolveUrl ?? url
        const asyncBuffer = await asyncBufferFromUrl(sourceUrl)
        const from = { url: sourceUrl, byteLength: asyncBuffer.byteLength }
        setProgress(0.66)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        // setMetadata(metadata) // never used
        let dataframe = parquetDataFrame(from, metadata)
        dataframe = rowCache(dataframe)
        const fileSize = asyncBuffer.byteLength
        setContent({ dataframe, fileSize })
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
        setProgress(1)
      }
    }
    if (loading === LoadingState.NotLoaded) {
      setLoading(LoadingState.Loading)
      loadParquetDataFrame().catch(() => undefined)
    }
  }, [loading, url, resolveUrl, setError, setProgress])

  const onDoubleClickCell: (col: number, row: number) => void = (col: number, row: number) => {
    changeQueryString(`?url=${url}&row=${row.toString()}&col=${col.toString()}`)
  }

  const headers = <>
    {content?.dataframe && <span>{content.dataframe.numRows.toLocaleString('en-US')} rows</span>}
  </>

  return <ContentHeader content={content} headers={headers}>
    {content?.dataframe && <HighTable
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </ContentHeader>
}
