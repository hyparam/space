import { imageTypes } from './files.ts'
import ImageView from './viewers/ImageView.tsx'
import MarkdownView from './viewers/MarkdownView.tsx'
import TableView from './viewers/ParquetView.tsx'
import TextView from './viewers/TextView.tsx'

interface ViewerProps {
  url: string
  resolveUrl: string
  setError: (error: Error | undefined) => void
  setProgress: (progress: number | undefined) => void
  headers?: Record<string, string>
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({ url, resolveUrl, setError, setProgress, headers }: ViewerProps) {
  const filename = url.replace(/\?.*$/, '') // remove query string
  if (filename.endsWith('.md')) {
    return <MarkdownView url={resolveUrl} setError={setError} headers={headers} />
  } else if (filename.endsWith('.parquet')) {
    return <TableView url={url} resolveUrl={resolveUrl} setError={setError} setProgress={setProgress} headers={headers} />
  } else if (imageTypes.some(type => filename.endsWith(type))) {
    return <ImageView url={resolveUrl} setError={setError} headers={headers} />
  }

  // Default to text viewer
  return <TextView
    url={resolveUrl}
    setError={setError}
    setProgress={setProgress}
    headers={headers} />
}
