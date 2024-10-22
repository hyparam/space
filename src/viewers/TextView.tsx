import { useEffect, useRef, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import ContentHeader from './ContentHeader.tsx'
import { setFetchHeaders } from '../utils.ts'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  url: string
  setError: (error: Error | undefined) => void
  setProgress: (progress: number | undefined) => void
  headers?: Record<string, string>
}

/**
 * Text viewer component.
 */
export default function TextView({ url, setError, headers }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string>()
  const textRef = useRef<HTMLPreElement>(null)

  // Load plain text content
  useEffect(() => {
    console.log('headers', headers)
    async function loadContent() {
      try {
        const res = await setFetchHeaders(headers)(url)
        const text = await res.text()
        setError(undefined)
        setText(text)        
      } catch (error) {
        setError(error as Error)
        setText(undefined)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading(()=> {
      // use loading state to ensure we only load content once
      // if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError, headers])

  const headersSpan = <>
    <span>{text ? newlines(text) : 0} lines</span>
  </>

  // Simple text viewer
  return <ContentHeader content={{ fileSize: text?.length }} headers={headersSpan}>
    <code className='text' ref={textRef}>
      {text}
    </code>

    {loading && <Spinner className='center' />}
  </ContentHeader>
}

function newlines(str: string): string {
  let count = 0
  for (const c of str) {
    if (c === '\n') count++
  }
  return count.toLocaleString('en-US')
}
