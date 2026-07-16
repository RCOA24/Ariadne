"use client";

import { FileCode2, LoaderCircle, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  path: string;
  extension: string;
  language: string;
  size: number;
  folders: string[];
};

type Page = { items: Item[]; nextCursor?: string };

export function RepositoryFileBrowser({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const parameters = new URLSearchParams({ limit: "100" });
        if (cursor) parameters.set("cursor", cursor);
        const response = await fetch(
          `/api/repositories/${repositoryId}/knowledge?${parameters.toString()}`,
        );
        if (!response.ok) {
          setError("No analyzed files are available yet.");
          return;
        }
        const page = (await response.json()) as Page;
        setItems((current) =>
          cursor ? [...current, ...page.items] : page.items,
        );
        setNextCursor(page.nextCursor);
      } catch {
        setError("Files could not be loaded. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [repositoryId],
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!query || item.path.toLowerCase().includes(query.toLowerCase())) &&
          (!language || item.language === language),
      ),
    [items, query, language],
  );
  const languages = [...new Set(items.map((item) => item.language))].sort();

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Repository workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Files</h1>
          <p className="mt-2 text-sm text-slate-400">
            Browse analyzed source files in small, responsive pages.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-sm text-slate-400">
          {items.length} loaded
        </span>
      </header>

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-slate-400 focus-within:border-cyan-400">
          <Search className="size-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter loaded files by path"
            className="w-full bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </label>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
        >
          <option value="">All languages</option>
          {languages.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-amber-200">
          {error}
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/35">
            {filtered.map((item) => (
              <a
                key={item.id}
                href={`/repositories/${repositoryId}/files/${item.id}`}
                className="group flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-3 transition hover:bg-cyan-400/[0.04] last:border-0"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <FileCode2 className="size-4 shrink-0 text-violet-300" />
                  <span className="truncate text-sm text-slate-200 group-hover:text-white">
                    {item.path}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                  {item.language}
                </span>
              </a>
            ))}
            {!isLoading && filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-500">
                No loaded files match the current filters.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              {query || language
                ? `${filtered.length} matching loaded files`
                : "Load more only when you need it."}
            </p>
            {nextCursor && (
              <button
                onClick={() => void loadPage(nextCursor)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2 font-medium text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50"
              >
                {isLoading && <LoaderCircle className="size-4 animate-spin" />}
                {isLoading ? "Loading" : "Load next 100"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
