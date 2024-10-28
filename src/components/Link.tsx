import { changeQueryString } from "../lib/huggingface.ts";
import { ReactNode } from 'react'

// workaround for Hugging Face spaces
export default function Link({ url, children, className }: { url: string; children?: ReactNode; className?: string }) {
    return (
      <a
        className={className}
        href={`/?url=${url}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          changeQueryString(`?url=${url}`);
        }}
      >
        {children}
      </a>
    );
  }