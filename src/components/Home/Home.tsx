import { OAuthResult } from '@huggingface/hub'
import { FormEvent, useEffect } from 'react'
import HFLoginIcon from '../../assets/sign-in-with-huggingface-lg.svg'
import { login, logout } from '../../lib/auth.js'
import { changeQueryString } from '../../lib/huggingfaceSource.js'
import Search from '../Search/Search.js'
import styles from './Home.module.css'

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

  // pre-dismiss the welcome popup since user landed on the home page
  useEffect(() => {
    localStorage.setItem('welcome:dismissed', 'true')
  }, [])

  return (
    <div className={styles.home}>
      <h1>Hyperparam Space</h1>
      <h2>Hyperparam Space</h2>
      <p>
        This is the <a href="https://hyperparam.app">hyperparam.app</a> interactive dataset viewer, embedded in a Hugging Face Space.
      </p>
      <p>
        Hyperparam aims to be the best tool for exploring huge unstructured text datasets in the browser.
        You can rapidly scroll through datasets and double-click cells to see full text content.
      </p>

      <section>
        <h3>Select a dataset on Hugging Face</h3>
        {auth &&
          <p>Logged in as
            <img src={avatarUrl} alt={auth.userInfo.name} className={styles.avatar} />
            {auth.userInfo.name} (<a onClick={logout}>Log out</a>).
            You can search your private and gated datasets.
          </p>
        }
        {!auth && <>
          <p>Sign in with HF to access your private and gated datasets.</p>
          <p>
            <a onClick={() => {
              void login()
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
        <form onSubmit={onUrlSubmit} className={styles.urlForm}>
          <label htmlFor="url">URL</label>
          <input name="url" defaultValue="https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet" type="url" />
          <button type="submit">Open</button>
        </form>
      </section>
    </div>
  )
}
