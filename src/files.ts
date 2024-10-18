export interface FileMetadata {
  type: "file" | "directory";
  oid: string;
  size: number;
  path: string;
}

// export interface FileMetadata {
//   key: string;
//   eTag?: string;
//   fileSize?: number;
//   lastModified: string;
// }
/// https://huggingface.co/api/datasets/codeparrot/github-code/treesize/main
/// https://huggingface.co/api/datasets/codeparrot/github-code/refs
/// https://huggingface.co/api/datasets/codeparrot/github-code/tree/main/data (paginated - no date)

// export interface FileContent<T> {
//   body: T
//   key: string
//   contentLength?: number
//   contentType?: string
//   eTag?: string
//   fileName?: string
//   fileSize?: number
//   lastModified?: string
//   contentRange?: string
// }

function getNextPageUrl(headers: Headers): string | null {
  return (
    /<(?<url>\S*?); rel="Next"/i.exec(headers.get("link") ?? "")?.groups?.url ??
    null
  );
}

async function fetchPage<T>(
  url: string,
  init?: RequestInit
): Promise<{ page: T[]; headers: Headers }> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status.toString()}`);
  }
  return {
    page: (await response.json()) as T[],
    headers: response.headers,
  };
}

async function paginate<T>(url: string, init?: RequestInit): Promise<T[]> {
  /* Fetch all the results of a paginated API URL.
   * This is using the same "Link" header format as GitHub.
   * See https://docs.github.com/en/rest/guides/traversing-with-pagination#link-header
   */

  const pages: T[][] = [];
  let result = await fetchPage<T>(url, init);
  pages.push(result.page);

  // Follow pages
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const nextPageUrl = getNextPageUrl(result.headers)
    if (!nextPageUrl) {
      break
    }
    if (nextPageUrl === url) {
      // just in case
      throw new Error(`Infinite loop detected: ${url}`);
    }
    url = nextPageUrl;
    console.log(`Pagination detected. Requesting next page: ${url}`);
    result = await fetchPage<T>(url, init);
    pages.push(result.page);
  }
  return pages.flat();
}

/**
 * List contents of a folder in a HF dataset repo
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

// export function getFileDateShort(file?: { lastModified?: string }): string {
//   if (!file?.lastModified) return ''
//   const date = new Date(file.lastModified)
//   // time if within last 24 hours, date otherwise
//   const time = date.getTime()
//   const now = Date.now()
//   if (now - time < 86400000) {
//     return date.toLocaleTimeString('en-US')
//   }
//   return date.toLocaleDateString('en-US')
// }

// /**
//  * Parse date from lastModified field and format as locale string
//  *
//  * @param file file-like object with lastModified
//  * @param file.lastModified last modified date string
//  * @returns formatted date string
//  */
// export function getFileDate(file?: { lastModified?: string }): string {
//   if (!file?.lastModified) return ''
//   const date = new Date(file.lastModified)
//   return isFinite(date.getTime()) ? date.toLocaleString('en-US') : ''
// }

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
