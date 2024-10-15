import Cell from './Cell.tsx'
import File from './File.tsx'
// import Folder from './Folder.tsx'
import './App.css'

function App() {
  const search = new URLSearchParams(location.search)
  const key = search.get('key') ?? "https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet"
  if (Array.isArray(key)) throw new Error('key must be a string')

  // if (!key || key.endsWith('/')) {
  //   // folder view
  //   const prefix = key.replace(/\/$/, '')
  //   return <Folder prefix={prefix} />
  // } else if (search.has('col') && search.has('row')) {
  if (search.has('col') && search.has('row')) {
    // cell view
    return <Cell file={key} row={Number(search.get('row'))} col={Number(search.get('col'))} />
  } else {
    // file view
    return <File file={key} />
  }
}

export default App