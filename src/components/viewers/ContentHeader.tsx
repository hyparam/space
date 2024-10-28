import { ReactNode } from 'react'
import { getFileSize } from '../../lib/files.js'

interface ContentHeaderProps {
  content?: { fileSize?: number }
  headers?: ReactNode
  children?: ReactNode
}

export default function ContentHeader({ content, headers, children }: ContentHeaderProps) {
  return <div className='viewer'>
    <div className='view-header'>
      {content?.fileSize && <span title={content.fileSize.toLocaleString('en-US') + ' bytes'}>
        {getFileSize(content)}
      </span>}
      {headers}
    </div>
    {children}
  </div>
}

