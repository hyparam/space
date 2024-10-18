import { changeQueryString } from "./huggingface.ts";
import { ReactNode } from 'react'

// workaround for Hugging Face spaces
export default function Link({ url, children }: { url: string; children?: ReactNode }) {
    return (
      <a
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