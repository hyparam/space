import Cell from "./Cell.tsx";
import File from "./File.tsx";
// import Folder from './Folder.tsx'
import "./App.css";
import { parseUrl } from "./huggingface.ts";
import Layout from "./Layout.tsx";
import Breadcrumb from "./Breadcrumb.tsx";

function App() {
  const search = new URLSearchParams(location.search);
  // TODO(SL): handle URLs with encoded `#`, like https://huggingface.co/datasets/codeparrot/github-code/blob/refs%2Fconvert%2Fparquet/C%23-all/partial-train/0000.parquet
  const url =
    search.get("url") ??
    "https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet";
  if (Array.isArray(url)) throw new Error("url must be a string");

  try {
    const parsedUrl = parseUrl(url);
    if (
      parsedUrl.kind === "base" ||
      parsedUrl.kind === "repo" ||
      parsedUrl.kind === "folder"
    ) {
      return (
        <Layout title={parsedUrl.kind}>
          <Breadcrumb url={parsedUrl} />
          <div className="error">Not implemented yet</div>
          <pre>{JSON.stringify(parsedUrl, null, 2)}</pre>
        </Layout>
      );
    }
    // file or non-hf
    if (search.has("col") && search.has("row")) {
      // cell view
      return (
        <Cell
          url={parsedUrl}
          row={Number(search.get("row"))}
          col={Number(search.get("col"))}
        />
      );
    } else {
      // file view
      return <File url={parsedUrl} />;
    }
  } catch (error) {
    return (
      <Layout error={error as Error} title="Error">
        <div className="error">{(error as Error).message}</div>
      </Layout>
    );
  }

  // TODO:
  // - handle non HF differently from File
  // - blob => resolve
  // - base => select a dataset
  // - repo => find the branches, and select one (refs/convert/parquet, or main ?) + provide a select for the branches in the breadcrumb?, and show a folder
  // - folder => show the files + select for the branches in the breadcrumb?
  // - file => select for the branches in the breadcrumb?
}

export default App;
