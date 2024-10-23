import { useCallback, useContext, useEffect, useState } from "react";
import { ParsedUrl, baseUrl, getUrlParts } from "./huggingface.ts";
import Link from "./Link.tsx";
import LinkButton from "./LinkButton.tsx";
import Dropdown from "./Dropdown.tsx";
import { listRefs, RefMetadata } from "./files.ts";
import { AuthContext } from "./contexts/AuthContext.tsx";

interface BreadcrumbProps {
  url: ParsedUrl;
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ url }: BreadcrumbProps) {
  // TODDO(SL): export to its own component
  const [refs, setRefs] = useState<RefMetadata[]>();
  const auth = useContext(AuthContext);

  // Fetch refs on component mount
  useEffect(() => {
    if (!("branch" in url) || !auth) {
      setRefs([]);
      return;
    }
    listRefs(url.namespace, url.repo, { headers: auth.headers })
      .then(setRefs)
      .catch(() => {
        setRefs([]);
        // silently ignore error
      });
    // TODO(SL): test that the branch is in the list of refs?
  }, [url, auth]);

  const getRefLink = useCallback(
    (ref: RefMetadata) => {
      if (!("branch" in url)) {
        return;
      }
      // branches and tags don't have a prefix
      const pathElement =
        /^(refs\/(heads|tags)\/)?(?<pathElement>[^/]+)$/.exec(ref.ref)?.groups
          ?.pathElement ?? ref.ref; // fail silently if the ref is not in the expected format
      const refUrl = `${baseUrl}/${url.namespace}/${
        url.repo
      }/tree/${encodeURIComponent(pathElement)}/`;
      return {
        refUrl,
        pathElement: decodeURIComponent(pathElement),
      };
    },
    [url]
  );

  return (
    <nav className="top-header">
      <a href="/" className="home"></a>
      <div className="path">
        {getUrlParts(url).map(({ url: href, text, branch }, i) => {
          if ("branch" in url && url.branch === branch && refs) {
            const prefix = text.split(branch)[0];
            const prefixLink =
              prefix.length > 0 ? (
                <Link url={href} key={i}>
                  {prefix}
                </Link>
              ) : undefined;
            return (
              <>
                {prefixLink}
                <Dropdown label={decodeURIComponent(branch)} key={i}>
                  {refs.map((ref, index) => {
                    const refLink = getRefLink(ref);
                    if (!refLink) {
                      return null;
                    }
                    const { refUrl, pathElement } = refLink;
                    return (
                      <LinkButton url={refUrl} key={index}>
                        {pathElement}
                      </LinkButton>
                    );
                  })}
                </Dropdown>
              </>
            );
          }
          return (
            <Link url={href} key={i}>
              {text}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// TODO(SL): the horizontal scroll (when shown) is above the text. Should we give more space, or what? use ellipsis to reduce the text width?
// TODO(SL): add buttons to open in HF (tree/blob), or to download (file only)
