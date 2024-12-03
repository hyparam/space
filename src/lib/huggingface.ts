import { ListFileEntry, listFiles } from '@huggingface/hub'
import { FileKind, FileMetadata, FileSystem, SourcePart, getFileName } from '@hyparam/components'

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

export class HuggingFaceFileSystem extends FileSystem {
  fsId = 'huggingface' as const
  canParse(source: string): boolean {
    try {
      parseHuggingFaceUrl(source)
    } catch {
      return false
    }
    return true
  }
  getKind(source: string): FileKind {
    return parseHuggingFaceUrl(source).kind === 'file' ? 'file' : 'directory'
    /// ^ repo is considered as a directory
  }
  getFileName(source: string): string {
    return getFileName(source)
  }
  getPrefix(source: string): string {
    const url = parseHuggingFaceUrl(source)
    if (url.kind === 'file') {
      throw new Error('Not a directory URL')
    }
    return `${url.origin}/datasets/${url.repo}/tree/${url.branch}${url.path}`.replace(/\/$/, '')
  }
  getResolveUrl(source: string): string {
    const url = parseHuggingFaceUrl(source)
    if (url.kind === 'file') {
      return url.resolveUrl
    }
    throw new Error('Not a file URL')
  }
  getSourceParts(source: string): SourcePart[] {
    const url = parseHuggingFaceUrl(source)
    // if (url.kind === 'repo') {
    //   const repoUrl = `${baseUrl}/${url.repo}`
    //   return [{ source: repoUrl, name: repoUrl }]
    // }
    const sourceParts: SourcePart[] = [{
      source: `${baseUrl}/${url.repo}/tree/${url.branch}/`,
      name: `${baseUrl}/${url.repo}/${url.action}/${url.branch}/`,
    }]

    const pathParts = url.path.split('/').filter(d => d.length > 0)
    const lastPart = pathParts.at(-1)
    if (lastPart) {
      for (let i = 0; i < pathParts.length - 1; i++) {
        sourceParts.push({
          source: `${baseUrl}/${url.repo}/tree/${url.branch}/${pathParts.slice(0, i + 1).join('/')}`,
          name: pathParts[i] + '/',
        })
      }
      sourceParts.push({
        source: `${baseUrl}/${url.repo}/${url.action}/${url.branch}${url.path}`,
        name: lastPart,
      })
    }
    return sourceParts
  }
  async _fetchFilesList(url: DirectoryUrl): Promise<ListFileEntry[]> {
    const filesIterator = listFiles({
      repo: `datasets/${url.repo}`,
      revision: url.branch,
      path: 'path' in url ? url.path.replace(/^\//, '') : '', // remove leading slash if any
      expand: true,
    })
    const files: ListFileEntry[] = []
    for await (const file of filesIterator) {
      files.push(file)
    }
    return files
  }
  async listFiles(prefix: string): Promise<FileMetadata[]> {
    const url = parseHuggingFaceUrl(prefix)
    if (url.kind === 'file') {
      throw new Error('Not a directory URL')
    }
    const files = await this._fetchFilesList(url)
    return files.map(file => ({
      name: getFileName(file.path),
      eTag: file.lastCommit?.id,
      size: file.size,
      lastModified: file.lastCommit?.date,
      source: `${url.origin}/datasets/${url.repo}/${file.type === 'file' ? 'blob' : 'tree'}/${url.branch}/${file.path}`.replace(/\/$/, ''),
      kind: file.type === 'file' ? 'file' : 'directory', // 'unknown' is considered as a directory
    }))
  }
}

export interface DirectoryUrl {
  kind: 'directory';
  source: string;
  origin: string;
  repo: string;
  action: 'tree';
  branch: string;
  path: string;
}

export interface FileUrl {
  kind: 'file';
  source: string;
  origin: string;
  repo: string;
  action: 'resolve' | 'blob';
  branch: string;
  path: string;
  resolveUrl: string;
}

type HFUrl = DirectoryUrl | FileUrl;

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

  const repoGroups = /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/?$/.exec(
    urlObject.pathname,
  )?.groups
  if (repoGroups && ['namespace', 'dataset'].every(d => d in repoGroups)) {
    return {
      kind: 'directory',
      source: url,
      origin: urlObject.origin,
      repo: repoGroups.namespace + '/' + repoGroups.dataset,
      action: 'tree',
      branch: 'main', // hardcode the default branch
      path: '',
    }
  }

  const folderGroups =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/(?<action>tree)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname,
    )?.groups
  if (folderGroups && ['namespace', 'dataset', 'action', 'branch', 'path'].every(d => d in folderGroups) && folderGroups.branch !== 'refs') {
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/datasets/${folderGroups.namespace}/${folderGroups.dataset}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'directory',
      source,
      origin: urlObject.origin,
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
      origin: urlObject.origin,
      repo: fileGroups.namespace + '/' + fileGroups.dataset,
      action: fileGroups.action === 'blob' ? 'blob' : 'resolve',
      branch,
      path: fileGroups.path,
      resolveUrl: `${urlObject.origin}/datasets/${fileGroups.namespace}/${fileGroups.dataset}/resolve/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported Hugging Face URL')
}
