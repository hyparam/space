import Cell from './Cell.tsx'
import File from './File.tsx'
// import Folder from './Folder.tsx'
import './App.css'
import { parseUrl } from './huggingface.ts'

function App() {
  const search = new URLSearchParams(location.search)
  const key = search.get('key') ?? "https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet"
  if (Array.isArray(key)) throw new Error('key must be a string')

  const url = parseUrl(key)
  // ^ can throw - TODO: handle error, or manage it like non-hf?

  // TODO:
  // - handle non HF differently from File
  // - blob => resolve
  // - base => select a dataset
  // - repo => find the branches, and select one (refs/convert/parquet, or main ?) + provide a select for the branches?, and show a folder
  // - folder => show the files + select for the branches?
  // - file => show the file + select for the branches?
  
  console.log(url)
  // if (!key || key.endsWith('/')) {
  // if (key.endsWith('/')) {
  //   // folder view
  //   const prefix = key.replace(/\/$/, '')
  //   return <Folder prefix={prefix} />
  // } else 
  if (url.kind === "file" || url.kind === "non-hf") {
    if (search.has('col') && search.has('row')) {
      // cell view
      return <Cell file={key} row={Number(search.get('row'))} col={Number(search.get('col'))} />
    } else {
      // file view
      return <File file={key} />
    }
  }
}

export default App