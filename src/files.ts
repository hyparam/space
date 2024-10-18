export interface FileMetadata {
  type: "file" | "directory";
  oid: string;
  size: number;
  path: string;
}

interface RefResponse {
  name: string;
  ref: string;
  targetCommit: string;
}

export const refTypes = [
  "branches",
  "tags",
  "converts",
  "pullRequests",
] as const;
type RefType = (typeof refTypes)[number];
type RefsResponse = Partial<Record<RefType, RefResponse[]>>;

export interface RefMetadata extends RefResponse {
  refType: RefType; // TODO(SL): use it to style the refs differently?
}

function getNextPageUrl(headers: Headers): string | null {
  return (
    /<(?<url>\S*?); rel="Next"/i.exec(headers.get("link") ?? "")?.groups?.url ??
    null
  );
}

// async function fetchPage<T>(
//   url: string,
//   init?: RequestInit
// ): Promise<{ page: T[]; headers: Headers }> {
//   const response = await fetch(url, init);
//   if (!response.ok) {
//     throw new Error(`HTTP error ${response.status.toString()}`);
//   }
//   return {
//     page: (await response.json()) as T[],
//     headers: response.headers,
//   };
// }

async function paginate<T>(url: string, init?: RequestInit): Promise<T[]> {
  /* Fetch all the results of a paginated API URL.
   * This is using the same "Link" header format as GitHub.
   * See https://docs.github.com/en/rest/guides/traversing-with-pagination#link-header
   */
  const pages: T[][] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const response = await fetch(nextUrl, init);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status.toString()}`);
    }
    pages.push(await response.json() as T[])
    nextUrl = getNextPageUrl(response.headers);
  }
  return pages.flat();
}

/**
 * List contents of a folder in a HF dataset repo
 *
 * Example API URL: https://huggingface.co/api/datasets/codeparrot/github-code/tree/main/data
 *
 * @param namespace namespace name (org or user)
 * @param repo repository name
 * @param branch branch name
 * @param path folder path
 */
export async function listFiles(
  namespace: string,
  repo: string,
  branch: string,
  path: string
): Promise<FileMetadata[]> {
  // TODO(SL): support private/gated repos
  return paginate<FileMetadata>(
    `https://huggingface.co/api/datasets/${namespace}/${repo}/tree/${branch}${path}`
  );
}

/**
 * List refs in a HF dataset repo
 *
 * Example API URL: https://huggingface.co/api/datasets/codeparrot/github-code/refs
 *
 * @param namespace
 * @param repo
 *
 * @returns the list of branches, tags, pull requests, and converts
 */
export async function listRefs(
  namespace: string,
  repo: string
): Promise<RefMetadata[]> {
  // TODO(SL): support private/gated repos
  const response = await fetch(
    `https://huggingface.co/api/datasets/${namespace}/${repo}/refs`
  );
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status.toString()}`);
  }
  const refsByType = await response.json() as RefsResponse;
  return refTypes.flatMap(
    (refType) =>
      refsByType[refType]?.map((refResponse) => ({ refType, ...refResponse })) ?? []
  );
}

/**
 * Format file size in human readable format
 *
 * @param file file-like object with fileSize
 * @param file.fileSize file size in bytes
 * @returns formatted file size string
 */
export function getFileSize(file?: { fileSize?: number }): string {
  return file?.fileSize !== undefined ? formatFileSize(file.fileSize) : "";
}

/**
 * Returns the file size in human readable format
 *
 * @param bytes file size in bytes
 * @returns formatted file size string
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["b", "kb", "mb", "gb", "tb"];
  if (bytes === 0) return "0 b";
  const i = Math.floor(Math.log2(bytes) / 10);
  if (i === 0) return bytes.toLocaleString("en-US") + " b";
  const base = bytes / Math.pow(1024, i);
  return (
    (base < 10 ? base.toFixed(1) : Math.round(base)).toLocaleString("en-US") +
    " " +
    sizes[i]
  );
}

/**
 * Parse the content-length header from a fetch response.
 *
 * @param headers fetch response headers
 * @returns content length in bytes or undefined if not found
 */
export function parseFileSize(headers: Headers): number | undefined {
  const contentLength = headers.get("content-length");
  return contentLength ? Number(contentLength) : undefined;
}

export const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export const imageTypes = [".png", ".jpg", ".jpeg", ".gif", ".svg"];
