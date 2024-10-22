import { useEffect, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import Markdown from '../Markdown.tsx'
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
  headers?: Record<string, string>
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ url, setError, headers }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()


  useEffect(() => {
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

    setLoading(() => {
      // use loading state to ensure we only load content once
      // if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError, headers])

  return <ContentHeader content={{ fileSize: text?.length }}>
    <Markdown className='markdown' text={text ?? ''} />

    { loading === LoadingState.Loading && <Spinner className='center' /> }
  </ContentHeader>
}
