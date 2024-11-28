import { ReactNode } from 'react'
import { changeQueryString } from '../lib/huggingface.js'

// workaround for Hugging Face spaces
export default function Link({ url, children, className }: { url?: string; children?: ReactNode; className?: string }) {
  const queryString = url ? `?url=${url}` : ''
  return (
    <a
      className={className}
      href={`/${queryString}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        changeQueryString(queryString)
      }}
    >
      {children}
    </a>
  )
}
