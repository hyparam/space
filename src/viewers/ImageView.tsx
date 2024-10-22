import { useEffect, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import ContentHeader from './ContentHeader.tsx'
import { contentTypes, parseFileSize } from '../files.ts'
import { setFetchHeaders } from '../utils.ts'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  url: string
  setError: (error: Error | undefined) => void
  headers?: Record<string, string>
}

interface Content {
  dataUri: string
  fileSize?: number
}

/**
 * Image viewer component.
 */
export default function ImageView({ url, setError, headers }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await setFetchHeaders(headers)(url)
        const arrayBuffer = await res.arrayBuffer()
        // base64 encode and display image
        const b64 = arrayBufferToBase64(arrayBuffer)
        const dataUri = `data:${contentType(url)};base64,${b64}`
        const fileSize = parseFileSize(res.headers)
        setContent({ dataUri, fileSize })
        setError(undefined)
      } catch (error) {
        setContent(undefined)
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading(() => {
      // use loading state to ensure we only load content once
      // if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError, headers])

  return <ContentHeader content={content}>
    {content?.dataUri && <img
      alt={url}
      className='image'
      src={content.dataUri} />}
    
    {loading && <Spinner className='center' />}
  </ContentHeader>
}

/**
 * Convert an ArrayBuffer to a base64 string.
 *
 * @param buffer - the ArrayBuffer to convert
 * @returns base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function contentType(filename: string): string {
  const ext = filename.split('.').pop() ?? ''
  return contentTypes[ext] || 'image/png'
}