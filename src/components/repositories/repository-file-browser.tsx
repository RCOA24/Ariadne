"use client";
import { useEffect, useMemo, useState } from "react";
type Item = {
  id: string;
  path: string;
  extension: string;
  language: string;
  size: number;
  folders: string[];
};
export function RepositoryFileBrowser({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState<string>();
  useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/knowledge?limit=200`).then(
      async (r) =>
        r.ok
          ? setItems((await r.json()).items)
          : setError("No analyzed files are available yet."),
    );
  }, [repositoryId]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!query || item.path.toLowerCase().includes(query.toLowerCase())) &&
          (!language || item.language === language),
      ),
    [items, query, language],
  );
  const languages = [...new Set(items.map((item) => item.language))];
  return (
    <section className="py-7">
      <h1 className="text-2xl font-semibold text-white">Files</h1>
      <div className="mt-5 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg bg-slate-900 px-3"
        >
          <option value="">All languages</option>
          {languages.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="mt-8 text-amber-300">{error}</p>
      ) : (
        <div className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={`/repositories/${repositoryId}/files/${item.id}`}
              className="flex justify-between gap-4 p-3 hover:bg-slate-900"
            >
              <span className="truncate text-slate-200">{item.path}</span>
              <span className="shrink-0 text-sm text-cyan-300">
                {item.language}
              </span>
            </a>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-slate-500">
              No files match the current filters.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
