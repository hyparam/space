import { DatasetEntry, listDatasets } from '@huggingface/hub'
import { ChangeEvent, useEffect, useState } from 'react'
import { baseUrl } from '../lib/huggingface.js'
import Link from './Link.js'

export default function Search() {
  const [query, setQuery] = useState<string>()
  const [datasets, setDatasets] = useState<DatasetEntry[]>([])

  useEffect(() => {
    async function fetchDatasets() {
      const newDatasets: DatasetEntry[] = []
      for await (const dataset of listDatasets({
        search: { query },
        limit: 10,
        fetch,
      })) {
        newDatasets.push(dataset)
      }
      setDatasets(newDatasets)
    }
    fetchDatasets().catch((error: unknown) => {
      setDatasets([])
      console.error(error)
    })
  }, [query])

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
  }

  return (
    <>
      <input type="search" onChange={onChange} />
      <ul className="ref-list">
        {datasets.map((dataset) =>
          <li key={dataset.name} style={{ fontSize: '0.9rem' }}>
            <Link url={`${baseUrl}/${dataset.name}`}>{dataset.name}</Link>
          </li>,
        )}
      </ul>
    </>
  )
}
