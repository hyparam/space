import { OAuthResult } from '@huggingface/hub'
import { FormEvent } from 'react'
import HFLoginIcon from '../assets/sign-in-with-huggingface-lg.svg'
import { login, logout } from '../lib/auth.js'
import { changeQueryString } from '../lib/huggingfaceSource.js'
import Search from './Search.js'

/**
 * Home page
 */
export default function Home({ auth }: { auth: OAuthResult | undefined }) {
  // @ts-expect-error avatarUrl is real
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const avatarUrl: string | undefined = auth?.userInfo.avatarUrl

  function onUrlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = new FormData(event.currentTarget).get('url') as string
    changeQueryString(`?url=${url}`)
  }

  return (
    <div id="welcome">
      <h1>Hyperparam</h1>
      <h2>Advanced Dataset Viewer Space</h2>
      <p>
        Hyperparam is a high performance dataset viewer for parquet files.
        It leverages the power of parquet files and http ranged get requests to provide a fast and efficient way to view large datasets in the browser.
      </p>

      <section>
        <h3>Select a dataset on Hugging Face</h3>
        {auth &&
          <p>Logged in as
            <img src={avatarUrl} alt={auth.userInfo.name} className='avatar' />
            {auth.userInfo.name} (<a onClick={logout}>Log out</a>).
            You can search your private and gated datasets.
          </p>
        }
        {!auth && <>
          <p>Log in to search your private and gated datasets</p>
          <p>
            <a onClick={() => {
              login().catch(() => undefined)
            }}>
              <img
                src={HFLoginIcon}
                alt="Sign in with Hugging Face"
              />
            </a>
          </p>
        </>}
        <p>Search for dataset:</p>
        <Search accessToken={auth?.accessToken}></Search>
      </section>
      <section>
        <h3>Parquet URL</h3>
        <p>You can also set a url to see your parquet data. 👀</p>
        <form onSubmit={onUrlSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <label htmlFor="url">URL</label>
          <input name="url" defaultValue="https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet" style={{ width: '100%' }} type="url" />
          <button type="submit">Open</button>
        </form>
      </section>
    </div>
  )
}
