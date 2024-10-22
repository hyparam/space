import { useCallback, useEffect, useRef, useState } from "react";
import { formatFileSize } from "./files.ts";
import { listFiles, ListFileEntry } from "@huggingface/hub";
import Layout, { Spinner } from "./Layout.tsx";
import { cn, setFetchHeaders } from "./utils.ts";
import { baseUrl, FolderUrl } from "./huggingface.ts";
import Breadcrumb from "./Breadcrumb.tsx";
import Link from "./Link.tsx";

interface FolderProps {
  url: FolderUrl;
  headers?: Record<string, string>;
}

/**
 * Folder browser page
 */
export default function Folder({ url, headers }: FolderProps) {
  // State to hold file listing
  const [files, setFiles] = useState<ListFileEntry[]>();
  const [error, setError] = useState<Error>();
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch files on component mount
  useEffect(() => {
    async function fetchFiles() {
      const filesIterator = listFiles({
        repo: `datasets/${url.namespace}/${url.repo}`,
        revision: url.branch,
        path: url.path.replace(/^\//, ""), // remove leading slash if any
        // TODO(SL): pass expand: true, to get the date
        fetch: setFetchHeaders(headers)
      })
      const files = []
      for await (const file of filesIterator) {
        files.push(file)
      }
      setFiles(files)
      setError(undefined)
    }
    fetchFiles()
      .catch((error: unknown) => {
        setFiles([]);
        setError(error as Error);
      });
  }, [url, headers]);

  const fileUrl = useCallback(
    (file: ListFileEntry) => {
      const action = file.type === "directory" ? "tree" : "blob";
      return `${baseUrl}/${url.namespace}/${url.repo}/${action}/${url.branch}/${file.path}`;
    },
    [url]
  );

  const fileName = useCallback((file: ListFileEntry) => {
    return file.path.split("/").at(-1);
  }, []);

  return (
    <Layout error={error} title={url.path}>
      <Breadcrumb url={url} />

      {files && files.length > 0 && (
        <ul className="file-list" ref={listRef}>
          {files.map((file, index) => (
            <li key={index}>
              <Link url={fileUrl(file)}>
                <span
                  className={cn(
                    "file-name",
                    "file",
                    file.type === "directory" && "folder"
                  )}
                >
                  {fileName(file)}
                </span>
                {file.type === "file" && (
                  <>
                    <span
                      className="file-size"
                      title={file.size.toLocaleString("en-US") + " bytes"}
                    >
                      {formatFileSize(file.size)}
                    </span>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {files?.length === 0 && <div className="center">No files</div>}
      {files === undefined && <Spinner className="center" />}
    </Layout>
  );
}
