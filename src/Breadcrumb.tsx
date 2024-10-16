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
        {/* {!isUrl && <>
          <a href='/files'>/</a>
          {file && file.split('/').slice(0, -1).map((sub, depth) =>
            <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
          )}
          <a href={`/files?key=${file}`}>{fileName}</a>
        </>} */}
      </div>
    </nav>
  );
}
