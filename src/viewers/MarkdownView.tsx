import { useContext, useEffect, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import Markdown from '../Markdown.tsx'
import ContentHeader from './ContentHeader.tsx'
import { AuthContext } from '../contexts/authContext.ts'


enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  url: string
  setError: (error: Error | undefined) => void  
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ url, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const auth = useContext(AuthContext)


  useEffect(() => {
    if (!auth) {
      // Auth not loaded yet
      return
    }
    const { fetch } = auth
    async function loadContent() {
      try {
        const res = await fetch(url)
        const text = await res.text()
        if (res.status == 401) {
          setError(new Error(text))
          setText(undefined)
          return
        }
        setError(undefined)
        setText(text)
      } catch (error) {
        setError(error as Error)
        setText(undefined)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading((loading) => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError, auth])

  return <ContentHeader content={{ fileSize: text?.length }}>
    <Markdown className='markdown' text={text ?? ''} />

    { loading === LoadingState.Loading && <Spinner className='center' /> }
  </ContentHeader>
}
