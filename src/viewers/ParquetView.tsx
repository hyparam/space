import HighTable, { DataFrame, rowCache } from "hightable";
import { useContext, useEffect, useState } from "react";
import { parquetDataFrame } from "../tableProvider.ts";
import { Spinner } from "../Layout.tsx";
import ContentHeader from "./ContentHeader.tsx";
import { parquetMetadataAsync } from "hyparquet";
import { changeQueryString } from "../huggingface.ts";
import { asyncBufferFromUrl } from "../utils.ts";
import { AuthContext } from "../contexts/AuthContext.tsx";

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded,
}

interface ViewerProps {
  url: string;
  resolveUrl: string;
  setProgress: (progress: number | undefined) => void;
  setError: (error: Error | undefined) => void;
}

interface Content {
  dataframe: DataFrame;
  fileSize?: number;
}

/**
 * Parquet file viewer
 */
export default function ParquetView({
  url,
  resolveUrl,
  setProgress,
  setError,
}: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded);
  const [content, setContent] = useState<Content>();
  const auth = useContext(AuthContext);

  useEffect(() => {
    if (!auth) {
      // Auth not loaded yet
      return;
    }
    const { headers } = auth;
    async function loadParquetDataFrame() {
      try {
        setProgress(0.33);
        const asyncBuffer = await asyncBufferFromUrl({
          url: resolveUrl,
          headers,
        });
        const from = {
          url: resolveUrl,
          byteLength: asyncBuffer.byteLength,
          headers,
        };
        setProgress(0.66);
        const metadata = await parquetMetadataAsync(asyncBuffer);
        let dataframe = parquetDataFrame(from, metadata);
        dataframe = rowCache(dataframe);
        const fileSize = asyncBuffer.byteLength;
        setContent({ dataframe, fileSize });
        setError(undefined);
      } catch (error) {
        setError(error as Error);
        setContent(undefined);
      } finally {
        setLoading(LoadingState.Loaded);
        setProgress(1);
      }
    }
    if (loading === LoadingState.NotLoaded) {
      setLoading(LoadingState.Loading);
      loadParquetDataFrame().catch(() => undefined);
    }
  }, [loading, url, resolveUrl, setError, setProgress, auth]);

  const onDoubleClickCell: (col: number, row: number) => void = (
    col: number,
    row: number
  ) => {
    changeQueryString(
      `?url=${url}&row=${row.toString()}&col=${col.toString()}`
    );
  };

  const headersSpan = (
    <>
      {content?.dataframe && (
        <span>{content.dataframe.numRows.toLocaleString("en-US")} rows</span>
      )}
    </>
  );

  return (
    <ContentHeader content={content} headers={headersSpan}>
      {content?.dataframe && (
        <HighTable
          data={content.dataframe}
          onDoubleClickCell={onDoubleClickCell}
          onError={setError}
        />
      )}

      {loading && <Spinner className="center" />}
    </ContentHeader>
  );
}
