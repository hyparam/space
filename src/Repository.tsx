import { useCallback, useEffect, useRef, useState } from "react";
import { listRefs, RefMetadata } from "./files.ts";
import Layout, { Spinner } from "./Layout.tsx";
import { baseUrl, RepoUrl } from "./huggingface.ts";
import Breadcrumb from "./Breadcrumb.tsx";
import Link from "./Link.tsx";

interface RepositoryProps {
  url: RepoUrl;
}

// {
//   "tags": [
//     {
//       "name": "v1.0",
//       "ref": "refs/tags/v1.0",
//       "targetCommit": "71bef20b6f797c27273b865f2cc5aa3419481278"
//     },
//     {
//       "name": "v1.1",
//       "ref": "refs/tags/v1.1",
//       "targetCommit": "3cda80127bda30a4eef5f712f739b69a3a3a5980"
//     }
//   ],
//   "branches": [
//     {
//       "name": "main",
//       "ref": "refs/heads/main",
//       "targetCommit": "b5661e6b17396364b2bcf8e68977b0d28e1ebd19"
//     }
//   ],
//   "converts": [
//     {
//       "name": "parquet",
//       "ref": "refs/convert/parquet",
//       "targetCommit": "b88aff789d4fe05af7cd4faa78cdfe855930e40c"
//     }
//   ]
// }

/**
 * Repository page
 */
export default function Folder({ url }: RepositoryProps) {
  // State to hold file listing
  const [refs, setRefs] = useState<RefMetadata[]>();
  const [error, setError] = useState<Error>();
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch files on component mount
  useEffect(() => {
    listRefs(url.namespace, url.repo)
      .then(setRefs)
      .catch((error: unknown) => {
        setRefs([]);
        setError(error as Error);
      });
  }, [url]);

  const refLink = useCallback(
    (ref: RefMetadata) => {
      // branches and tags don't have a prefix
      const pathElement =
        /^(refs\/(heads|tags)\/)?(?<pathElement>[^/]+)$/.exec(ref.ref)?.groups
          ?.pathElement ?? ref.ref; // fail silently if the ref is not in the expected format
      const refUrl = `${baseUrl}/${url.namespace}/${
        url.repo
      }/tree/${encodeURIComponent(pathElement)}/`;
      return <Link url={refUrl}>{pathElement}</Link>;
    },
    [url]
  );

  return (
    <Layout error={error} title={`${url.namespace}/${url.repo}`}>
      <Breadcrumb url={url} />

      <h2>Dataset <code>{url.namespace}/{url.repo}</code></h2>
      <p>Select a branch</p>
      {refs && refs.length > 0 && (
        <ul className="ref-list" ref={listRef}>
          {refs.map((ref, index) => (
            <li className={"ref-" + ref.refType} key={index}>{refLink(ref)}</li>
          ))}
        </ul>
      )}
      {refs?.length === 0 && <div className="center">No branches</div>}
      {refs === undefined && <Spinner className="center" />}
    </Layout>
  );
}
