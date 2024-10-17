import { ParsedUrl, getUrlParts } from "./huggingface.ts";
import Link from "./Link.tsx";

interface BreadcrumbProps {
  url: ParsedUrl;
}


/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ url }: BreadcrumbProps) {
  return (
    <nav className="top-header">
      <div className="path">
        {getUrlParts(url).map(({url, text}, i) => <Link url={url} key={i}>{text}</Link>)}
      </div>
    </nav>
  );
}

// TODO(SL): the horizontal scroll (when shown) is above the text. Should we give more space, or what? use ellipsis to reduce the text width?
// TODO(SL): add buttons to open in HF (tree/blob), or to download (file only)