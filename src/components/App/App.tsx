
import { OAuthResult } from '@huggingface/hub'
import { Config, ConfigProvider, Page, getHttpSource } from 'hyperparam'
import { useEffect, useMemo, useState } from 'react'
import { fetchOAuth, getLocalOAuth } from '../../lib/auth.js'
import { getHuggingFaceSource } from '../../lib/huggingfaceSource.js'
import Home from '../Home/Home.js'

function getRequestInit(accessToken: string | undefined): RequestInit | undefined {
  if (!accessToken) return undefined
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

export default function App() {
  const localOAuth = getLocalOAuth()
  const [auth, setAuth] = useState<OAuthResult | undefined>(localOAuth)
  const [accessToken, setAccessToken] = useState<string | undefined>(localOAuth?.accessToken)
  const [requestInit, setRequestInit] = useState<RequestInit | undefined>(getRequestInit(localOAuth?.accessToken))

  const config: Config = useMemo(() => ({
    customClass: {
      highTable: 'hightable',
    },
    routes: {
      getSourceRouteUrl: ({ sourceId }) => `/?url=${sourceId}`,
      getCellRouteUrl: ({ sourceId, col, row }) => `/?url=${sourceId}&col=${col}&row=${row}`,
    },
    welcome: {
      content: <>
        <h2>Hyperparam Space</h2>
        <p>
          This is the <a href="https://hyperparam.app">hyperparam.app</a> interactive dataset viewer, embedded in a Hugging Face Space.
        </p>
        <p>
          Hyperparam aims to be the best tool for exploring huge unstructured text datasets in the browser.
          You can rapidly scroll through datasets and double-click cells to see full text content.
        </p>
        <p>
          Sign in with HF to access private and gated datasets.
        </p>
      </>,
    },
  }), [])

  useEffect(() => {
    if (auth) return
    // no local auth, try to fetch it
    fetchOAuth()
      .then((oAuthResult) => {
        setAuth(oAuthResult)
        if (!oAuthResult) return
        setAccessToken(oAuthResult.accessToken)
        setRequestInit(getRequestInit(oAuthResult.accessToken))
      })
      .catch((e: unknown) => {
        console.error('Error fetching OAuth')
        console.error(e)
      })
  }, [auth])

  const search = new URLSearchParams(location.search)
  const sourceId = search.get('url')
  const row = search.get('row') === null ? undefined : Number(search.get('row'))
  const col = search.get('col') === null ? undefined : Number(search.get('col'))

  if (sourceId === null) {
    return <Home auth={auth}></Home>
  }

  const source = getHuggingFaceSource(sourceId, { requestInit, accessToken }) ?? getHttpSource(sourceId)

  if (!source) {
    const defaultUrl = '/?url=https://huggingface.co/datasets/severo/test-parquet/resolve/main/parquet/csv-train-00000-of-00001.parquet'
    return <div>Could not load a data source. You have to pass a valid source in the url, eg: <a href={defaultUrl}>{defaultUrl}</a>.</div>
  }

  /* Send a message to the parent window to synchronize the query string
   *
   * Hugging Face Space impose some restrictions to the static apps that are hosted on their platform,
   * with respect to the URLs. Only hash and query strings can be changed, and doing so requires
   * some custom code:
   *   https://huggingface.co/docs/hub/spaces-handle-url-parameters
   *
   * Note that the iframe has no access to the parent window's location, so
   * it might already by in sync, we just don't know.
   */
  window.parent.postMessage({ queryString: window.location.search }, 'https://huggingface.co')

  return <ConfigProvider value={config}>
    <Page source={source} navigation={{ row, col }} />
  </ConfigProvider>
}
