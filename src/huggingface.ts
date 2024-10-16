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

export interface NonHfUrl {
  url: string;
  kind: "non-hf";
}

export interface BaseUrl extends Omit<NonHfUrl, "kind">  {
  kind: "base";
}

export interface RepoUrl extends Omit<BaseUrl, "kind">  {
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
  url: string
): NonHfUrl | BaseUrl | RepoUrl | FolderUrl | FileUrl {
  const urlObject = new URL(url);
  // ^ throws 'TypeError: URL constructor: {url} is not a valid URL.' if url is not a valid URL
  
  if (urlObject.protocol !== "https:" && urlObject.protocol !== "http:") {
    throw new Error("url must be a HTTP URL");
  }

  if (urlObject.host !== "huggingface.co" && urlObject.host !== "hf.co") {
    return { kind: "non-hf", url } as NonHfUrl;
  }

  if (/^\/(datasets(\/)?)?$/.exec(urlObject.pathname)) {
    return { kind: "base", url } as BaseUrl;
  }

  const repoCheck = /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    urlObject.pathname
  );
  if (repoCheck?.groups) {
    return { kind: "repo", url, ...repoCheck.groups } as RepoUrl;
  }

  const folderCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/tree\/(?<branch>[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname
    );
  if (folderCheck?.groups && folderCheck.groups.branch !== "refs") {
    return { kind: "folder", url, ...folderCheck.groups } as FolderUrl;
  }

  const fileCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(blob|resolve)\/(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      urlObject.pathname
    );
  if (fileCheck?.groups && fileCheck.groups.branch !== "refs") {    
    return { kind: "file", url, ...fileCheck.groups } as FileUrl;
  }

  throw new Error("Unsupported Hugging Face URL");
}
