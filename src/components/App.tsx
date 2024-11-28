import { Cell, File, FileConfig, parseKey } from '@hyparam/components'
import Home from './Home.js'

export type AppConfig = FileConfig

interface PageProps {
  apiBaseUrl: string
  config?: AppConfig
}

export default function App({ apiBaseUrl, config }: PageProps) {
  const search = new URLSearchParams(location.search)
  const key = search.get('url')
  if (Array.isArray(key)) throw new Error('url must be a string')
  if (key === null) {
    return <Home></Home>
  }

  const parsedKey = parseKey(key, { apiBaseUrl } )

  // row, col from url
  const row = search.get('row')
  const col = search.get('col')

  if (parsedKey.kind !== 'url') {
    return <Home></Home>
  }

  if (row !== null && col !== null) {
    // cell view
    return <Cell parsedKey={parsedKey} row={Number(row)} col={Number(col)} />
  } else {
    // file view
    return <File parsedKey={parsedKey} config={config} />
  }
}
