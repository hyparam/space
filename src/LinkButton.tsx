import { changeQueryString } from "./huggingface.ts";
import { ReactNode } from 'react'

export default function LinkButton({ url, children }: { url: string; children?: ReactNode }) {
    return (
      <button
        onClick={() => {
          changeQueryString(`?url=${url}`);
        }}
      >
        {children}
      </button>
    );
  }