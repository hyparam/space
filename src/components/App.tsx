
import { Page, Source, createHttpFileSystem, getSource } from '@hyparam/components'
import { createHuggingFaceFileSystem } from '../lib/huggingface.js'
import Home from './Home.js'

const fileSystems = [
  createHuggingFaceFileSystem(),
  createHttpFileSystem(),
]

export default function App() {
  const search = new URLSearchParams(location.search)
  const sourceId = search.get('url')
  const row = search.get('row') === null ? undefined : Number(search.get('row'))
  const col = search.get('col') === null ? undefined : Number(search.get('col'))

  if (sourceId === null) {
    return <Home></Home>
  }

  let source: Source | undefined = undefined
  for (const fileSystem of fileSystems) {
    const fsSource = getSource(sourceId, fileSystem)
    if (fsSource){
      source = fsSource
      break
    }
  }

  if (!source) {
    const defaultUrl = '/?url=https://huggingface.co/datasets/severo/test-parquet/resolve/main/parquet/csv-train-00000-of-00001.parquet'
    return <div>Could not load a data source. You have to pass a valid source in the url, eg: <a href={defaultUrl}>{defaultUrl}</a>.</div>
  }
  return <Page source={source} navigation={{ row, col }} config={{
    routes: {
      getSourceRouteUrl: ({ sourceId }) => `/?url=${sourceId}`,
      getCellRouteUrl: ({ sourceId, col, row }) => `/?url=${sourceId}&col=${col}&row=${row}`,
    },
  }} />
}
