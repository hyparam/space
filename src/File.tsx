import { useState } from 'react'
import Layout from './Layout.tsx'
import Viewer from './Viewer.tsx'
import { NonHfUrl, FileUrl } from './huggingface.ts'
import Breadcrumb from './Breadcrumb.tsx'

interface FileProps {
  url: NonHfUrl | FileUrl
}

/**
 * File viewer page
 */
export default function File({ url }: FileProps) {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const path = (url.kind === "file" ? url.path: url.raw).split('/')
  if (path.length < 1) throw new Error('Invalid URL path')
  const fileName = path.at(-1);

  return <Layout progress={progress} error={error} title={fileName}>
    <Breadcrumb url={url} />
    <Viewer file={url.raw} setProgress={setProgress} setError={setError} />
    {/* ^ TODO(SL): pass url + support blob as well as resolve */}
  </Layout>
}
