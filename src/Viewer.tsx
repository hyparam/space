import { imageTypes } from './files.ts'
import ImageView from './viewers/ImageView.tsx'
import MarkdownView from './viewers/MarkdownView.tsx'
import TableView from './viewers/ParquetView.tsx'
import TextView from './viewers/TextView.tsx'

interface ViewerProps {
  url: string
  resolveUrl?: string
  setError: (error: Error) => void
  setProgress: (progress: number) => void
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({ url, resolveUrl, setError, setProgress }: ViewerProps) {
  const filename = url.replace(/\?.*$/, '') // remove query string
  if (filename.endsWith('.md')) {
    return <MarkdownView file={url} setError={setError} />
  } else if (filename.endsWith('.parquet')) {
    return <TableView url={url} resolveUrl={resolveUrl} setError={setError} setProgress={setProgress} />
  } else if (imageTypes.some(type => filename.endsWith(type))) {
    return <ImageView file={url} setError={setError} />
  }

  // Default to text viewer
  return <TextView
    file={url}
    setError={setError}
    setProgress={setProgress} />
}
