import { useEffect, useState } from "react";
import { listDatasets, DatasetEntry } from "@huggingface/hub";
import { baseUrl } from "./huggingface.ts";

export default function Search() {
  const [query, setQuery] = useState<string>();
  const [datasets, setDatasets] = useState<DatasetEntry[]>([]);

  useEffect(() => {
    async function fetchDatasets() {
      const newDatasets: DatasetEntry[] = [];
      for await (const dataset of listDatasets({
        search: { query },
        limit: 10,
      })) {
        newDatasets.push(dataset);
      }
      setDatasets(newDatasets);
    }
    fetchDatasets().catch((error: unknown) => {
      setDatasets([]);
      console.error(error);
    });
  }, [query]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <>
      <input type="search" onChange={onChange} />
      <ul>
        {datasets.map((dataset) => (
          <li key={dataset.name}>
            <a href={`/?url=${baseUrl}/${dataset.name}`}>{dataset.name}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
