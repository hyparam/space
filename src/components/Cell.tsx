import { useContext, useEffect, useState } from "react";
import { parquetDataFrame } from "../lib/tableProvider.js";
import Layout from "./Layout.tsx";
import { parquetMetadataAsync } from "hyparquet";
import { NonHfUrl, FileUrl } from "../lib/huggingface.ts";
import Breadcrumb from "./Breadcrumb.tsx";
import { asyncBufferFromUrl } from "../lib/utils.ts";
import { AuthContext } from "../contexts/authContext.ts";
import { asyncRows } from 'hightable'

interface CellProps {
  url: NonHfUrl | FileUrl;
  row: number;
  col: number;
}

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded,
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView({ url, row, col }: CellProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded);
  const [text, setText] = useState<string | undefined>();
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<Error>();
  const auth = useContext(AuthContext);

  // File path from url
  const path = (url.kind === "file" ? url.path : url.raw).split("/");
  if (path.length < 1) throw new Error("Invalid URL path");
  const fileName = path.at(-1);

  // Load cell data
  useEffect(() => {
    if (!auth) {
      // Auth not loaded yet
      return;
    }
    const { headers } = auth;
    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        setProgress(0.25);
        const sourceUrl = url.kind === "file" ? url.resolveUrl : url.raw;
        const asyncBuffer = await asyncBufferFromUrl({
          url: sourceUrl,
          headers,
        });
        const from = {
          url: sourceUrl,
          byteLength: asyncBuffer.byteLength,
          headers,
        };
        setProgress(0.5);
        const metadata = await parquetMetadataAsync(asyncBuffer);
        setProgress(0.75);
        const df = parquetDataFrame(from, metadata);
        const rows = await df.rows(row, row + 1);
        // Convert to AsyncRows
        const asyncRow = asyncRows(rows, 1, df.header)[0]
        // Await cell data
        const text = await asyncRow[df.header[col]].then(stringify)
        setText(text);
        setError(undefined);
      } catch (error) {
        setError(error as Error);
        setText(undefined);
      } finally {
        setLoading(LoadingState.Loaded);
        setProgress(undefined);
      }
    }

    if (loading === LoadingState.NotLoaded) {
      // use loading state to ensure we only load content once
      setLoading(LoadingState.Loading);
      loadCellData().catch(() => undefined);
    }
  }, [url, col, row, loading, setError, auth]);

  return (
    <Layout progress={progress} error={error} title={fileName}>
      <Breadcrumb url={url} />

      {/* <Highlight text={text || ''} /> */}
      <pre className="viewer text">{text}</pre>
    </Layout>
  );
}

/**
 * Robust stringification of any value, including json and bigints.
 */
function stringify(value: unknown): string {
  if (value === "string") return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (Array.isArray(value))
    return `[\n${value.map((v) => indent(stringify(v), 2)).join(",\n")}\n]`;
  if (value === null || value === undefined) return JSON.stringify(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .filter((d) => d[1] !== undefined)
      .map(([k, v]) => `${k}: ${stringify(v)}`)
      .join(", ")}}`;
  }
  return `{}`;
}

function indent(text: string | undefined, spaces: number) {
  return text
    ?.split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");
}
