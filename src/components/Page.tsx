import Cell from "./Cell.tsx";
import File from "./File.tsx";
import Folder from "./Folder.tsx";
import "../styles/App.css";
import { parseUrl } from "../lib/huggingface.ts";
import Layout from "./Layout.tsx";
import Home from "./Home.tsx";

export default function Page() {
  const search = new URLSearchParams(location.search);
  // TODO(SL): handle URLs with encoded `#`, like https://huggingface.co/datasets/codeparrot/github-code/blob/refs%2Fconvert%2Fparquet/C%23-all/partial-train/0000.parquet
  const url = search.get("url");
  if (Array.isArray(url)) throw new Error("url must be a string");

  if (url === null) {
    return (
      // <Layout title="Home">
      <Home></Home>
      // </Layout>
    );
  }

  try {
    const parsedUrl = parseUrl(url);
    if (parsedUrl.kind === "base") {
      return (
        // <Layout title="Home">
        <Home></Home>
        // </Layout>
      );
    }
    if (parsedUrl.kind === "repo") {
      // repository view
      // for now: assume the "main" branch exists, and show it
      return (
        <Folder
          url={{
            ...parsedUrl,
            kind: "folder",
            path: "",
            branch: "main",
            action: "tree",
          }}
        />
      );
    }
    if (parsedUrl.kind === "folder") {
      // folder view
      return <Folder url={parsedUrl} />;
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
}
