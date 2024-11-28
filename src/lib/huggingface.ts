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
