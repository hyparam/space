import { useContext, useEffect, useState } from "react";
import { listDatasets, DatasetEntry } from "@huggingface/hub";
import { baseUrl } from "./huggingface.ts";
import Link from "./Link.tsx";
import { AuthContext } from "./contexts/AuthContext.tsx";

export default function Search() {
  const [query, setQuery] = useState<string>();
  const [datasets, setDatasets] = useState<DatasetEntry[]>([]);
  const auth = useContext(AuthContext);

  useEffect(() => {
    if (!auth) {
      // Auth not loaded yet
      return;
    }
    const fetch = auth.fetch;
    async function fetchDatasets() {
      const newDatasets: DatasetEntry[] = [];
      for await (const dataset of listDatasets({
        search: { query },
        // TODO(SL) ^ we can set the owner if logged in with {owner: auth.oAuthResult?.userInfo.name}
        limit: 10,
        fetch
      })) {
        newDatasets.push(dataset);
      }
      setDatasets(newDatasets);
    }
    fetchDatasets().catch((error: unknown) => {
      setDatasets([]);
      console.error(error);
    });
  }, [query, auth]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <>
      <input type="search" onChange={onChange} />
      <ul className="ref-list">
        {datasets.map((dataset) => (
          <li key={dataset.name} style={{ fontSize: "0.9rem" }}>
            <Link url={`${baseUrl}/${dataset.name}`}>{dataset.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
