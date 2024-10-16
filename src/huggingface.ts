// Hugging Face Space impose some restrictions to the static apps that are hosted on their platform,
// with respect to the URLs. Only hash and query strings can be changed, and doing so requires
// some custom code:
//   https://huggingface.co/docs/hub/spaces-handle-url-parameters
export function changeQueryString(queryString: string) {
  const url = new URL(window.location.href);
  url.search = queryString;
  window.parent.postMessage({ queryString }, "https://huggingface.co");
  window.location.assign(url);
}

// try to parse a Hugging Face URL
//  const matches = /^https:\/\/(huggingface|hf)\.co\/datasets\/(.+?)\/(.+?)\/resolve\/(.+?)\/(.+?)$/i.exec(key)

// cases:
// - not a URL => error
// - nothing, or hugging face or hugging face datasets => select a HF dataset
// - a dataset repo => refs/convert/parquet branch, otherwise main branch, folder view
// - a dataset repo + a branch => folder view
// - a dataset repo + a branch + a path to a folder => folder view
// - else: a file
//   - col and row => cell view
//   - else => file view

interface Url {
  key: string;
}

export interface NonHfUrl extends Url {
  kind: "non-hf";
}

export interface BaseUrl extends Url {
  kind: "base";
}

export interface RepoUrl extends Url {
  kind: "repo";
  namespace: string;
  repo: string;
}

export interface FolderUrl extends Omit<RepoUrl, "kind"> {
  kind: "folder";
  branch: string;
  path: string;
}

export interface FileUrl extends Omit<FolderUrl, "kind"> {
  kind: "file";
}

export function parseUrl(
  key: string
): NonHfUrl | BaseUrl | RepoUrl | FolderUrl | FileUrl {
  const url = new URL(key);
  // ^ throws 'TypeError: URL constructor: {key} is not a valid URL.' if key is not a valid URL
  
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("key must be a HTTP URL");
  }

  if (url.host !== "huggingface.co" && url.host !== "hf.co") {
    return { kind: "non-hf", key } as NonHfUrl;
  }

  if (/^\/(datasets(\/)?)?$/.exec(url.pathname)) {
    return { kind: "base", key } as BaseUrl;
  }

  const repoCheck = /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    url.pathname
  );
  if (repoCheck?.groups) {
    return { kind: "repo", key, ...repoCheck.groups } as RepoUrl;
  }

  const folderCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/tree\/(?<branch>[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      url.pathname
    );
  if (folderCheck?.groups && folderCheck.groups.branch !== "refs") {
    return { kind: "folder", key, ...folderCheck.groups } as FolderUrl;
  }

  const fileCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(blob|resolve)\/(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      url.pathname
    );
  if (fileCheck?.groups && fileCheck.groups.branch !== "refs") {    
    return { kind: "file", key, ...fileCheck.groups } as FileUrl;
  }

  throw new Error("Unsupported Hugging Face URL");
}
