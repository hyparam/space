import { imageTypes } from './files.ts'
import ImageView from './viewers/ImageView.tsx'
import MarkdownView from './viewers/MarkdownView.tsx'
import TableView from './viewers/ParquetView.tsx'
import TextView from './viewers/TextView.tsx'

interface ViewerProps {
  file: string
  setError: (error: Error) => void
  setProgress: (progress: number) => void
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({ file, setError, setProgress }: ViewerProps) {
  const filename = file.replace(/\?.*$/, '') // remove query string
  if (filename.endsWith('.md')) {
    return <MarkdownView file={file} setError={setError} />
  } else if (filename.endsWith('.parquet')) {
    return <TableView file={file} setError={setError} setProgress={setProgress} />
  } else if (imageTypes.some(type => filename.endsWith(type))) {
    return <ImageView file={file} setError={setError} />
  }

  // Default to text viewer
  return <TextView
    file={file}
    setError={setError}
    setProgress={setProgress} />
}
