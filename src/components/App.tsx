
import { HttpFileSystem, HyperparamFileSystem, Page, Source } from '@hyparam/components'
import Home from './Home.js'

const fileSystems = [
  new HttpFileSystem(),
  new HyperparamFileSystem({ endpoint: location.origin }),
]

export default function App() {
  const search = new URLSearchParams(location.search)
  const url = search.get('url')
  const row = search.get('row') === null ? undefined : Number(search.get('row'))
  const col = search.get('col') === null ? undefined : Number(search.get('col'))

  if (url === null) {
    return <Home></Home>
  }

  let source: Source | undefined = undefined
  for (const fileSystem of fileSystems) {
    const fsSource = fileSystem.getSource(url)
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
    slidePanel: { minWidth: 250, maxWidth: 750 },
    routes: {
      getSourceRouteUrl: ({ source }) => `/?url=${source}`,
      getCellRouteUrl: ({ source, col, row }) => `/?url=${source}&col=${col}&row=${row}`,
    },
  }} />
}
