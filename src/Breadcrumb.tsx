import { changeQueryString, ParsedUrl, getUrlParts } from "./huggingface.ts";

interface BreadcrumbProps {
  url: ParsedUrl;
}

function Link({ url, text }: { url: string; text: string }) {
  return (
    <a
      href={`/?url=${url}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeQueryString(`?url=${url}`);
      }}
    >
      {text}
    </a>
  );
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ url }: BreadcrumbProps) {
  return (
    <nav className="top-header">
      <div className="path">
        {getUrlParts(url).map(({url, text}, i) => <Link url={url} text={text} key={i}></Link>)}
      </div>
    </nav>
  );
}
