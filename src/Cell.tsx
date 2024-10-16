import { useEffect, useState } from 'react'
import { parquetDataFrame } from './tableProvider.js'
import Layout from './Layout.js'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import { NonHfUrl, FileUrl } from './huggingface.ts'
import Breadcrumb from './Breadcrumb.tsx'

interface CellProps {
  url: NonHfUrl | FileUrl
  row: number
  col: number
}

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView({ url, row, col }: CellProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const path = (url.kind === "file" ? url.path: url.raw).split('/')
  if (path.length < 1) throw new Error('Invalid URL path')
  const fileName = path.at(-1);
    
  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        {/* ^ TODO(SL): support blob as well as resolve */}
        // TODO: handle first row > 100kb
        setProgress(0.25)
        const asyncBuffer = await asyncBufferFromUrl(url.raw)
        const from = { url: url.raw, byteLength: asyncBuffer.byteLength }
        setProgress(0.5)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        setProgress(0.75)
        const df = parquetDataFrame(from, metadata)
        const rows = await df.rows(row, row + 1)
        const colName = df.header[col]
        const text = stringify(rows[0][colName])
        setText(text)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
        setProgress(undefined)
      }
    }

    if (loading === LoadingState.NotLoaded) {
      // use loading state to ensure we only load content once
      setLoading(LoadingState.Loading)
      loadCellData().catch(() => undefined)
    }
  }, [url, col, row, loading, setError])

  return <Layout progress={progress} error={error} title={fileName}>
    <Breadcrumb url={url} />

    {/* <Highlight text={text || ''} /> */}
    <pre className="viewer text">{text}</pre>
  </Layout>
}

/**
 * Robust stringification of any value, including json and bigints.
 */
function stringify(value: unknown): string{
  if (value === 'string') return value
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toLocaleString('en-US')
  if (Array.isArray(value)) return `[\n${value.map(v => indent(stringify(v), 2)).join(',\n')}\n]`
  if (value === null || value === undefined) return JSON.stringify(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    return `{${Object.entries(value).filter(d => d[1] !== undefined).map(([k, v]) => `${k}: ${stringify(v)}`).join(', ')}}`
  }
  return `{}`
}

function indent(text: string | undefined, spaces: number) {
  return text?.split('\n').map(line => ' '.repeat(spaces) + line).join('\n')
}
