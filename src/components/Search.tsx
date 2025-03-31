import { DatasetEntry, listDatasets } from '@huggingface/hub'
import { ChangeEvent, useEffect, useState } from 'react'
import { baseUrl } from '../lib/huggingfaceSource.js'
import styles from '../styles/Search.module.css'
import Link from './Link.js'

export default function Search({ accessToken } : { accessToken?: string }) {
  const [query, setQuery] = useState<string>()
  const [datasets, setDatasets] = useState<DatasetEntry[]>([])

  useEffect(() => {
    async function fetchDatasets() {
      const newDatasets: DatasetEntry[] = []
      for await (const dataset of listDatasets({
        search: { query },
        limit: 10,
        /// TODO(SL): switch when https://github.com/huggingface/huggingface.js/issues/1063 is released
        // accessToken,
        credentials: accessToken ? { accessToken } : undefined,
      })) {
        newDatasets.push(dataset)
      }
      setDatasets(newDatasets)
    }
    fetchDatasets().catch((error: unknown) => {
      setDatasets([])
      console.error(error)
    })
  }, [query, accessToken])

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
  }

  return (
    <>
      <input type="search" onChange={onChange} />
      <ul className={styles.refList}>
        {datasets.map((dataset) =>
          <li key={dataset.name}>
            <Link url={`${baseUrl}/${dataset.name}`}>{dataset.name}</Link>
          </li>,
        )}
      </ul>
    </>
  )
}
