import { useEffect, useState } from 'react'
import Markdown from '../Markdown.tsx'
import ContentHeader from './ContentHeader.tsx'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setError: (error: Error) => void
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ file, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()


  useEffect(() => {
    const isUrl = file.startsWith('http://') || file.startsWith('https://')
    const url = isUrl ? file : '/api/store/get?key=' + file

    async function loadContent() {
      try {
        const res = await fetch(url)
        const text = await res.text()
        setText(text)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading(loading => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [file, loading, setError])

  return <ContentHeader content={{ fileSize: text?.length }}>
    <Markdown className='markdown' text={text ?? ''} />
  </ContentHeader>
}
