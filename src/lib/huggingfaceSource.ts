import { listFiles } from '@huggingface/hub'
import type { DirSource, FileMetadata, FileSource, SourcePart } from 'hyperparam'
import { getFileName } from 'hyperparam'

export const baseUrl = 'https://huggingface.co/datasets'

function getSourceParts(url: HFUrl): SourcePart[] {
  const sourceParts: SourcePart[] = [{
    sourceId: `${baseUrl}/${url.repo}/tree/${url.branch}/`,
    text: `${baseUrl}/${url.repo}/${url.action}/${url.branch}/`,
  }]

  const pathParts = url.path.split('/').filter(d => d.length > 0)
  const lastPart = pathParts.at(-1)
  if (lastPart) {
    for (let i = 0; i < pathParts.length - 1; i++) {
      sourceParts.push({
        sourceId: `${baseUrl}/${url.repo}/tree/${url.branch}/${pathParts.slice(0, i + 1).join('/')}`,
        text: pathParts[i] + '/',
      })
    }
    sourceParts.push({
      sourceId: `${baseUrl}/${url.repo}/${url.action}/${url.branch}${url.path}`,
      text: lastPart,
    })
  }
  return sourceParts
}
function getPrefix(url: DirectoryUrl): string {
  return `${url.origin}/datasets/${url.repo}/tree/${url.branch}${url.path}`.replace(/\/$/, '')
}
async function fetchFilesList(url: DirectoryUrl, options?: {requestInit?: RequestInit, accessToken?: string}): Promise<FileMetadata[]> {
  const filesIterator = listFiles({
    repo: `datasets/${url.repo}`,
    revision: url.branch,
    path: 'path' in url ? url.path.replace(/^\//, '') : '', // remove leading slash if any
    expand: true,
    accessToken: options?.accessToken,
  })
  const files: FileMetadata[] = []
  for await (const file of filesIterator) {
    files.push({
      name: getFileName(file.path),
      eTag: file.lastCommit?.id,
      size: file.size,
      lastModified: file.lastCommit?.date,
      sourceId: `${url.origin}/datasets/${url.repo}/${file.type === 'file' ? 'blob' : 'tree'}/${url.branch}/${file.path}`.replace(/\/$/, ''),
      kind: file.type === 'file' ? 'file' : 'directory', // 'unknown' is considered as a directory
    })
  }
  return files
}
export function getHuggingFaceSource(sourceId: string, options?: {requestInit?: RequestInit, accessToken?: string}): FileSource | DirSource | undefined {
  try {
    const url = parseHuggingFaceUrl(sourceId)
    if (url.kind === 'file') {
      return {
        kind: 'file',
        sourceId,
        sourceParts: getSourceParts(url),
        fileName: getFileName(url.path),
        resolveUrl: url.resolveUrl,
        requestInit: options?.requestInit,
      }
    } else {
      return {
        kind: 'directory',
        sourceId,
        sourceParts: getSourceParts(url),
        prefix: getPrefix(url),
        listFiles: () => fetchFilesList(url, options),
      }
    }
  } catch (e) {
    console.error(e)
    return undefined
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
