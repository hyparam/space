import Cell from './Cell.tsx'
import File from './File.tsx'
// import Folder from './Folder.tsx'
import './App.css'
import { parseUrl } from './huggingface.ts'

function App() {
  const search = new URLSearchParams(location.search)
  const url = search.get('url') ?? "https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet"
  if (Array.isArray(url)) throw new Error('url must be a string')

  const parsedUrl = parseUrl(url)
  // ^ can throw - TODO: handle error, or manage it like non-hf?

  // TODO:
  // - handle non HF differently from File
  // - blob => resolve
  // - base => select a dataset
  // - repo => find the branches, and select one (refs/convert/parquet, or main ?) + provide a select for the branches?, and show a folder
  // - folder => show the files + select for the branches?
  // - file => show the file + select for the branches?
  
  console.log(parsedUrl)
  // if (!url || url.endsWith('/')) {
  // if (url.endsWith('/')) {
  //   // folder view
  //   const prefix = url.replace(/\/$/, '')
  //   return <Folder prefix={prefix} />
  // } else 
  if (parsedUrl.kind === "file" || parsedUrl.kind === "non-hf") {
    if (search.has('col') && search.has('row')) {
      // cell view
      return <Cell file={url} row={Number(search.get('row'))} col={Number(search.get('col'))} />
    } else {
      // file view
      return <File file={url} />
    }
  }
}

export default App