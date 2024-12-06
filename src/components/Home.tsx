import { OAuthResult } from '@huggingface/hub'
import { FormEvent, useRef } from 'react'
import HFLoginIcon from '../assets/sign-in-with-huggingface-lg.svg'
import { login, logout } from '../lib/auth.js'
import { changeQueryString } from '../lib/huggingfaceSource.js'
import Link from './Link.js'
import Search from './Search.js'

/**
 * Home page
 */
export default function Home({ auth }: { auth: OAuthResult | undefined }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  function onUrlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = new FormData(event.currentTarget).get('url') as string
    changeQueryString(`?url=${url}`)
  }

  return (
    <div id="welcome">
      <h1>hyparquet</h1>
      <sub>
        /haɪ pɑːrˈkeɪ/
        <img
          src="audio.svg"
          alt="play hyparquet pronunciation"
          height="18"
          width="18"
          onClick={() => {
            audioRef.current?.play().catch(() => undefined)
          }}
        />
      </sub>
      <audio ref={audioRef} src="hyparquet.mp3"></audio>
      <h2>in-browser parquet file reader</h2>
      <p>
        <a href="https://www.npmjs.com/package/hyparquet">
          <img
            src="https://img.shields.io/npm/v/hyparquet"
            alt="npm hyparquet"
          />
        </a>{' '}
        <a href="https://github.com/hyparam/hyparquet">
          <img
            src="https://img.shields.io/github/stars/hyparam/hyparquet?style=social"
            alt="star hyparquet"
          />
        </a>
      </p>
      <p>
        Online demo of{' '}
        <a href="https://github.com/hyparam/hyparquet">hyparquet</a>: a parser
        for apache parquet files. Uses{' '}
        <a href="https://github.com/hyparam/hightable">hightable</a> for high
        performance windowed table viewing.
      </p>

      <section>
        <h3>Select a dataset on Hugging Face</h3>
        {
          auth ?
            <p>Logged in as
              <img src={auth.userInfo.avatarUrl} alt={auth.userInfo.name} style={{ width: '1rem', height: '1rem', borderRadius: '50%', margin: '0 0.5rem' }} />
              {auth.userInfo.name} (<a onClick={() => {logout()}}>Log out</a>). You can search your private and gated datasets.</p>
            : <><p>Log in to search your private and gated datasets</p><p><a
              onClick={() => {
                login().catch(() => undefined)
              }}
            >
              <img
                src={HFLoginIcon}
                alt="Sign in with Hugging Face"
              />
            </a></p></>
        }
        <p>Search for dataset:</p>
        <Search accessToken={auth?.accessToken}></Search>
      </section>
      <section>
        <h3>Parquet URL</h3>
        <p>You can also set a url to see your parquet data. 👀</p>
        <form onSubmit={onUrlSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <label htmlFor="url">URL</label>
          <input name="url" defaultValue="https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet" style={{ width: '100%' }} type="url" />
          <button style={{ fontSize: '1rem', padding: '0 0.5rem' }} type="submit">Open</button>
        </form>

        <p>
          <p>Example files:</p>
          <ul className="quick-links">
            <li>
              <Link
                className="aws"
                url="https://hyperparam-public.s3.amazonaws.com/wiki-en-00000-of-00041.parquet"
              >
                s3://wiki-en-00000-of-00041.parquet
              </Link>
            </li>
            <li>
              <Link
                className="azure"
                url="https://hyperparam.blob.core.windows.net/hyperparam/starcoderdata-js-00000-of-00065.parquet"
              >
                azure://starcoderdata-js-00000-of-00065.parquet
              </Link>
            </li>
            <li>
              <Link className="huggingface" url="https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet">
                huggingface://github-code-00000-of-01126.parquet
              </Link>
            </li>
            <li>
              <Link className="github" url="https://raw.githubusercontent.com/hyparam/hyparquet/master/test/files/rowgroups.parquet">
                github://rowgroups.parquet
              </Link>
            </li>
          </ul>
        </p>
      </section>
    </div>
  )
}
