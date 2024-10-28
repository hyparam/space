import { useContext, useRef } from "react";
import { changeQueryString } from "./huggingface.ts";
import Search from "./Search.tsx";
import { login, logout } from "./login.ts";
import { AuthContext } from "./contexts/authContext.ts";
import HFLoginIcon from './assets/sign-in-with-huggingface-lg.svg';

/**
 * Home page
 */
export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const auth = useContext(AuthContext);

  function onUrlSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = new FormData(event.currentTarget).get("url") as string;
    changeQueryString(`?url=${url}`);
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
            audioRef.current?.play().catch(() => undefined);
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
        </a>{" "}
        <a href="https://github.com/hyparam/hyparquet">
          <img
            src="https://img.shields.io/github/stars/hyparam/hyparquet?style=social"
            alt="star hyparquet"
          />
        </a>
      </p>
      <p>
        Online demo of{" "}
        <a href="https://github.com/hyparam/hyparquet">hyparquet</a>: a parser
        for apache parquet files. Uses{" "}
        <a href="https://github.com/hyparam/hightable">hightable</a> for high
        performance windowed table viewing.
      </p>

      <section>
        <h3>Select a dataset on Hugging Face</h3>
        {          
          auth?.oAuthResult ? (
            <p>Logged in as 
              <img src={auth.oAuthResult.userInfo.avatarUrl} alt={auth.oAuthResult.userInfo.name} style={{width: "1rem", height: "1rem", borderRadius: "50%", margin: "0 0.5rem"}} />
              {auth.oAuthResult.userInfo.name} (<a onClick={() => {logout()}}>Log out</a>). You can search your private and gated datasets.</p>
          ) : (
            <p>
              <p>Log in to search your private and gated datasets</p><a
              onClick={() => {
                login().catch(() => undefined);
              }}
            >
              
              <img
                src={HFLoginIcon}
                alt="Sign in with Hugging Face"
              />
            </a></p>
          )
        }
        <p>Search for  dataset:</p>
        <Search></Search>
      </section>
      <section>
        <h3>Parquet URL</h3>
        <p>You can also set a url to see your parquet data. 👀</p>
        <form onSubmit={onUrlSubmit} style={{display: "flex", gap: "1rem"}}>
          <label htmlFor="url">URL</label>
          <input name="url" defaultValue="https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet" style={{width: "100%"}} type="url"  />
          <button style={{fontSize: "1rem", padding: "0 0.5rem"}} type="submit">Open</button>
        </form>
        
        <p>
          <p>Example files:</p>
          <ul className="quick-links">
            <li>
              <a
                className="aws"
                href="?url=https://hyperparam-public.s3.amazonaws.com/wiki-en-00000-of-00041.parquet"
              >
                s3://wiki-en-00000-of-00041.parquet
              </a>
            </li>
            <li>
              <a
                className="azure"
                href="?url=https://hyperparam.blob.core.windows.net/hyperparam/starcoderdata-js-00000-of-00065.parquet"
              >
                azure://starcoderdata-js-00000-of-00065.parquet
              </a>
            </li>
            <li>
              <a
                className="huggingface"
                href="?url=https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet?download=true"
              >
                huggingface://github-code-00000-of-01126.parquet
              </a>
            </li>
            <li>
              <a
                className="github"
                href="?url=https://raw.githubusercontent.com/hyparam/hyparquet/master/test/files/rowgroups.parquet"
              >
                github://rowgroups.parquet
              </a>
            </li>
          </ul>
        </p>
      </section>
    </div>
  );
}
