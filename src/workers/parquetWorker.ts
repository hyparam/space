import { ColumnData, parquetQuery } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import type { ParquetReadWorkerOptions } from "./types.ts";
import { asyncBufferFrom } from "./parquetWorkerClient.ts";

self.onmessage = async ({
  data,
}: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const { metadata, asyncBuffer, rowStart, rowEnd, orderBy, queryId, chunks } =
    data;
  const file = await asyncBufferFrom(asyncBuffer);
  const onChunk = chunks
    ? (chunk: ColumnData) => {
        self.postMessage({ chunk, queryId });
      }
    : undefined;
  try {
    const result = await parquetQuery({
      metadata,
      file,
      rowStart,
      rowEnd,
      orderBy,
      compressors,
      onChunk,
    });
    self.postMessage({ result, queryId });
  } catch (error) {
    self.postMessage({ error, queryId });
  }
};
