export const baseUrl = 'https://huggingface.co/datasets'

// Hugging Face Space impose some restrictions to the static apps that are hosted on their platform,
// with respect to the URLs. Only hash and query strings can be changed, and doing so requires
// some custom code:
//   https://huggingface.co/docs/hub/spaces-handle-url-parameters
export function changeQueryString(queryString: string) {
  const url = new URL(window.location.href)
  url.search = queryString
  window.parent.postMessage({ queryString }, 'https://huggingface.co')
  window.location.assign(url)
}

export interface RepoUrl {
  kind: 'repo';
  source: string;
  repo: string;
}

export interface FolderUrl extends Omit<RepoUrl, 'kind'> {
  kind: 'folder';
  action: 'tree';
  branch: string;
  path: string;
}

export interface FileUrl extends Omit<FolderUrl, 'kind' | 'action'> {
  kind: 'file';
  action: 'resolve' | 'blob';
  resolveUrl: string;
}

type HFUrl = RepoUrl | FolderUrl | FileUrl;

export function parseHuggingFaceUrl(url: string): HFUrl {
  const urlObject = new URL(url)
  // ^ throws 'TypeError: URL constructor: {url} is not a valid URL.' if url is not a valid URL

  if (urlObject.protocol !== 'https:' && urlObject.protocol !== 'http:') {
    throw new Error('url must be a HTTP URL')
  }

  if (
    !['huggingface.co', 'huggingface.co', 'hf.co'].includes(urlObject.host) ||
    urlObject.protocol !== 'https:'
  ) {
    throw new Error('Not a Hugging Face URL')
  }

  const repoCheck = /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/?$/.exec(
    urlObject.pathname,
  )
  if (repoCheck?.groups?.namespace && repoCheck.groups.dataset ) {
    return { kind: 'repo', source: url, repo: repoCheck.groups.namespace + '/' + repoCheck.groups.dataset }
  }


  const folderGroups =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/(?<action>tree)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname,
    )?.groups
  if (folderGroups && ['namespace', 'dataset', 'action', 'branch', 'path'].every(d => d in folderGroups) && folderGroups.branch !== 'refs') {
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/datasets/${folderGroups.namespace}/${folderGroups.dataset}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'folder',
      source,
      repo: folderGroups.namespace + '/' + folderGroups.dataset,
      action: 'tree',
      branch,
      path: folderGroups.path,
    }
  }

  const fileGroups =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/(?<action>blob|resolve)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      urlObject.pathname,
    )?.groups
  if (fileGroups && ['namespace', 'dataset', 'action', 'branch', 'path'].every(d => d in fileGroups) && fileGroups.branch !== 'refs') {
    const branch = fileGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/datasets/${fileGroups.namespace}/${fileGroups.dataset}/${fileGroups.action}/${branch}${fileGroups.path}`
    return {
      kind: 'file',
      source,
      repo: fileGroups.namespace + '/' + fileGroups.dataset,
      action: fileGroups.action === 'blob' ? 'blob' : 'resolve',
      branch,
      path: fileGroups.path,
      resolveUrl: `${urlObject.origin}/datasets/${fileGroups.namespace}/${fileGroups.dataset}/resolve/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported Hugging Face URL')
}
