import { useCallback, useEffect, useRef, useState } from "react";
import { FileMetadata, formatFileSize, listFiles } from './files.ts'
import Layout, { Spinner } from "./Layout.tsx";
import { cn } from "./utils.ts";
import { baseUrl, FolderUrl } from "./huggingface.ts";
import Breadcrumb from "./Breadcrumb.tsx";
import Link from "./Link.tsx";

interface FolderProps {
  url: FolderUrl;
}

/**
 * Folder browser page
 */
export default function Folder({ url }: FolderProps) {
  // State to hold file listing
  const [files, setFiles] = useState<FileMetadata[]>();
  const [error, setError] = useState<Error>();
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch files on component mount
  useEffect(() => {
    listFiles(url.namespace, url.repo, url.branch, url.path)
      .then(setFiles)
      .catch((error: unknown) => {
        setFiles([]);
        setError(error as Error);
      });
  }, [url]);

  const fileUrl = useCallback(
    (file: FileMetadata) => {
      const action = file.type === "directory" ? "tree" : "blob";
      return `${baseUrl}/${url.namespace}/${url.repo}/${action}/${url.branch}/${file.path}`;
    },
    [url]
  );

  const fileName = useCallback(
    (file: FileMetadata) => {
      return file.path.split("/").at(-1);
    },
    []
  );

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
