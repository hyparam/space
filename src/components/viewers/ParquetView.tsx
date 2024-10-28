import HighTable, { DataFrame, rowCache } from "hightable";
import { useCallback, useContext, useEffect, useState } from "react";
import { parquetDataFrame } from "../../lib/tableProvider.ts";
import { Spinner } from "../Layout.tsx";
import ContentHeader from "./ContentHeader.tsx";
import { parquetMetadataAsync } from "hyparquet";
import { changeQueryString } from "../../lib/huggingface.ts";
import { asyncBufferFromUrl } from "../../lib/utils.ts";
import { AuthContext } from "../../contexts/authContext.ts";

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
  }, [loading, resolveUrl, setError, setProgress, auth]);

  const onDoubleClickCell = useCallback((col: number, row: number) => {
    changeQueryString(
      `?url=${url}&row=${row.toString()}&col=${col.toString()}`
    );
  }, [url]);

  const onMouseDownCell = useCallback((event: React.MouseEvent, col: number, row: number) => {
    if (event.button === 1) {
      // Middle click open in new tab
      event.preventDefault()
      const newUrl = new URL(window.location.href)
      newUrl.search = `?url=${url}&row=${row.toString()}&col=${col.toString()}`
      window.open(newUrl, '_blank')
      /// ^ note that on HF spaces, this will use the inner space URL (https://xxx-yyy.static.hf.space)
      /// and not the public space URL (https://huggingface.co/spaces/xxx/yyy). It's public too, so it's fine, I guess.
    }
  }, [url])

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
          cacheKey={resolveUrl}
          data={content.dataframe}
          onDoubleClickCell={onDoubleClickCell}
          onMouseDownCell={onMouseDownCell}
          onError={setError}
        />
      )}

      {loading && <Spinner className="center" />}
    </ContentHeader>
  );
}
