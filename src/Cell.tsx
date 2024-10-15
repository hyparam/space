import { useEffect, useState } from 'react'
import { parquetDataFrame } from './tableProvider.js'
import Layout from './Layout.js'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import { changeQueryString } from './huggingface.js'

interface CellProps {
  file: string
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
export default function CellView({ file, row, col }: CellProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

//   // File path from url
//   const search = new URLSearchParams(location.search)
//   const key = decodeURIComponent(search.get('key') ?? '')
//   const path = key.split('/')
//   const shortKey = path.at(-1)
//   const isUrl = key.startsWith('http://') || key.startsWith('https://')
//   const url = isUrl ? key : '/api/store/get?key=' + key
  // File path from url
  const path = file.split('/')
  if (path.length < 1) throw new Error('Invalid file path')
  const fileName = path.at(-1);
  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  if (!isUrl) throw new Error('Only urls are supported')
  const url = file
    
  // Load cell data
  useEffect(() => {


    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        setProgress(0.25)
        const asyncBuffer = await asyncBufferFromUrl(url)
        const from = { url, byteLength: asyncBuffer.byteLength }
        setProgress(0.5)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        setProgress(0.75)
        const df = parquetDataFrame(from, metadata)
        const rows = await df.rows(row, row + 1)
        const colName = df.header[col]
        // const cell = rows[0][colName]
        const text = stringify(rows[0][colName])
        // console.log('cell', cell, text)
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
    <nav className='top-header'>
      <div className='path'>
        {
          <a href={`/?key=${file}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeQueryString(`/?key=${file}`) }}>{file}</a>
        }
        {/* {!isUrl && <>
          <a href='/files'>/</a>
          {key && key.split('/').slice(0, -1).map((sub, depth) =>
            <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
          )}
          <a href={`/files?key=${key}`}>{path.at(-1)}</a>
        </>} */}
      </div>
    </nav>

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
