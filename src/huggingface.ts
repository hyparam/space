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
  raw: string;
  kind: "non-hf";
}

export interface BaseUrl extends Omit<NonHfUrl, "kind"> {
  kind: "base";
}

export interface RepoUrl extends Omit<BaseUrl, "kind"> {
  kind: "repo";
  namespace: string;
  repo: string;
}

export interface FolderUrl extends Omit<RepoUrl, "kind"> {
  kind: "folder";
  action: "tree";
  branch: string;
  path: string;
}

export interface FileUrl extends Omit<FolderUrl, "kind" | "action"> {
  kind: "file";
  action: "resolve" | "blob";
}

export type HfUrl = BaseUrl | RepoUrl | FolderUrl | FileUrl;
export type ParsedUrl = NonHfUrl | HfUrl;

export function parseUrl(url: string): ParsedUrl {
  const urlObject = new URL(url);
  // ^ throws 'TypeError: URL constructor: {url} is not a valid URL.' if url is not a valid URL

  if (urlObject.protocol !== "https:" && urlObject.protocol !== "http:") {
    throw new Error("url must be a HTTP URL");
  }

  if (
    (urlObject.host !== "huggingface.co" && urlObject.host !== "hf.co") ||
    urlObject.protocol !== "https:"
  ) {
    return { kind: "non-hf", raw: url } as NonHfUrl;
  }

  if (/^\/(datasets(\/)?)?$/.exec(urlObject.pathname)) {
    return { kind: "base", raw: url } as BaseUrl;
  }

  const repoCheck = /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    urlObject.pathname
  );
  if (repoCheck?.groups) {
    return { kind: "repo", raw: url, ...repoCheck.groups } as RepoUrl;
  }

  const folderCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>tree)\/(?<branch>[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname
    );
  if (folderCheck?.groups && folderCheck.groups.branch !== "refs") {
    return { kind: "folder", raw: url, ...folderCheck.groups } as FolderUrl;
  }

  const fileCheck =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>blob|resolve)\/(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      urlObject.pathname
    );
  if (fileCheck?.groups && fileCheck.groups.branch !== "refs") {
    return { kind: "file", raw: url, ...fileCheck.groups } as FileUrl;
  }

  throw new Error("Unsupported Hugging Face URL");
}

export interface UrlPart {
  url: string;
  text: string;
}

const baseUrl = "https://huggingface.co/datasets";

// TODO(SL): docstring + tests
export function getUrlParts(url: ParsedUrl): UrlPart[] {
  if (url.kind === "non-hf") {
    return [{ url: url.raw, text: url.raw }];
  } else {
    const urlParts = [{ url: baseUrl, text: baseUrl }];
    if (url.kind === "base") {
      return urlParts;
    }
    urlParts.push({
      url: `${baseUrl}/${url.namespace}`,
      text: url.namespace,
    });
    urlParts.push({
      url: `${baseUrl}/${url.namespace}/${url.repo}`,
      text: url.repo,
    });
    if (url.kind === "repo") {
      return urlParts;
    }
    urlParts.push({
      url: `${baseUrl}/${url.namespace}/${url.repo}/tree/${url.branch}`,
      text: `${url.action}/${url.branch}`
    });
    const pathParts = url.path.split("/").filter((part) => part !== "");
    const lastPart = pathParts.at(-1);
    if (!lastPart) {
      return urlParts;
    }
    for (let i = 0; i < pathParts.length - 1; i++) {
      urlParts.push({
        url: `${baseUrl}/${url.namespace}/${url.repo}/tree/${
          url.branch
        }${pathParts.slice(i).join("/")}`,
        text: pathParts[i],
      });
    }
    urlParts.push({
      url: `${baseUrl}/${url.namespace}/${url.repo}/${url.action}/${url.branch}${url.path}`,
      text: lastPart
    });
    return urlParts;
  }
}
