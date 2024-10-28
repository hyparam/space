import { useState } from 'react'
import Layout from "./Layout.tsx"
import Viewer from "./Viewer.tsx"
import { NonHfUrl, FileUrl } from '../lib/huggingface.ts'
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

  const resolveUrl = url.kind === "file" ? url.resolveUrl: url.raw
  // File path from url
  const path = resolveUrl.split('/')
  if (path.length < 1) throw new Error('Invalid URL path')
  const fileName = path.at(-1);

  return <Layout progress={progress} error={error} title={fileName}>
    <Breadcrumb url={url} />
    {/* TODO(SL): add 'layout' option, like in hyparam demo, to see Parquet metadata and layout */}
    <Viewer url={url.raw} resolveUrl={resolveUrl} setProgress={setProgress} setError={setError} />
  </Layout>
}
