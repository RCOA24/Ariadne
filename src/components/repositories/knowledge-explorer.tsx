"use client";

import {
  ChevronRight,
  FileCode2,
  GitFork,
  LoaderCircle,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type FileItem = { id: string; path: string; language: string; size: number };
type SymbolItem = {
  id: string;
  name: string;
  kind: string;
  qualifiedName: string;
  line: number;
  fileId: string;
};
type Detail = SymbolItem & {
  file: { path: string; language: string };
  related: SymbolItem[];
  relationships: {
    id: string;
    kind: string;
    sourceSymbolId: string;
    targetSymbolId: string;
    confidence: number;
  }[];
};
type Page<T> = { items: T[]; nextCursor?: string };

const kindLabels: Record<string, string> = {
  class: "Classes",
  interface: "Interfaces",
  function: "Functions",
  method: "Methods",
  "database-object": "Database objects",
};

export function KnowledgeExplorer({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [fileCursor, setFileCursor] = useState<string>();
  const [symbolCursor, setSymbolCursor] = useState<string>();
  const [detail, setDetail] = useState<Detail>();
  const [kind, setKind] = useState("");
  const [symbolQuery, setSymbolQuery] = useState("");
  const [error, setError] = useState<string>();
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);

  const loadFiles = useCallback(
    async (cursor?: string) => {
      setLoadingFiles(true);
      try {
        const query = new URLSearchParams({ limit: "50" });
        if (cursor) query.set("cursor", cursor);
        const response = await fetch(
          `/api/repositories/${repositoryId}/knowledge?${query.toString()}`,
        );
        if (!response.ok) {
          setError("Knowledge has not been generated yet.");
          return;
        }
        const page = (await response.json()) as Page<FileItem>;
        setFiles((current) =>
          cursor ? [...current, ...page.items] : page.items,
        );
        setFileCursor(page.nextCursor);
      } finally {
        setLoadingFiles(false);
      }
    },
    [repositoryId],
  );

  const loadSymbols = useCallback(
    async (cursor?: string, selectedKind = kind) => {
      setLoadingSymbols(true);
      try {
        const query = new URLSearchParams({ view: "symbols", limit: "75" });
        if (selectedKind) query.set("kind", selectedKind);
        if (cursor) query.set("cursor", cursor);
        const response = await fetch(
          `/api/repositories/${repositoryId}/knowledge?${query.toString()}`,
        );
        if (!response.ok) return;
        const page = (await response.json()) as Page<SymbolItem>;
        setSymbols((current) =>
          cursor ? [...current, ...page.items] : page.items,
        );
        setSymbolCursor(page.nextCursor);
      } finally {
        setLoadingSymbols(false);
      }
    },
    [kind, repositoryId],
  );

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    setDetail(undefined);
    void loadSymbols(undefined, kind);
  }, [kind, loadSymbols]);

  const select = async (id: string) => {
    const response = await fetch(
      `/api/repositories/${repositoryId}/knowledge/symbols/${id}`,
    );
    if (response.ok) setDetail(await response.json());
  };

  const visibleSymbols = symbols.filter((symbol) =>
    `${symbol.name} ${symbol.qualifiedName}`
      .toLowerCase()
      .includes(symbolQuery.toLowerCase()),
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Architecture intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Knowledge Explorer
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Navigate compiler-derived files, symbols, and verified
            relationships.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1.5">
            {files.length} files loaded
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1.5">
            {symbols.length} symbols loaded
          </span>
        </div>
      </header>

      {error ? (
        <p className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-amber-200">
          {error}
        </p>
      ) : (
        <div className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1fr_1.25fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/45">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-2">
                <FileCode2 className="size-4 text-cyan-300" />
                <h2 className="font-semibold text-white">File explorer</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Repository-relative source paths
              </p>
            </div>
            <div className="max-h-[60vh] overflow-auto p-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-800/70"
                >
                  <p className="truncate text-sm text-slate-200">{file.path}</p>
                  <p className="mt-1 text-xs text-cyan-300">{file.language}</p>
                </div>
              ))}
              {loadingFiles && <LoadingLabel label="Loading files" />}
            </div>
            {fileCursor && (
              <PaginationButton
                label="Load more files"
                loading={loadingFiles}
                onClick={() => void loadFiles(fileCursor)}
              />
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/45">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GitFork className="size-4 text-violet-300" />
                  <h2 className="font-semibold text-white">Symbol explorer</h2>
                </div>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">All symbols</option>
                  {Object.entries(kindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-slate-500 focus-within:border-violet-400">
                <Search className="size-3.5" />
                <input
                  value={symbolQuery}
                  onChange={(event) => setSymbolQuery(event.target.value)}
                  placeholder="Filter loaded symbols"
                  className="w-full bg-transparent py-2 text-xs text-slate-100 outline-none"
                />
              </label>
            </div>
            <div className="max-h-[60vh] overflow-auto p-2">
              {visibleSymbols.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => void select(symbol.id)}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left transition ${detail?.id === symbol.id ? "bg-violet-400/15" : "hover:bg-slate-800/70"}`}
                >
                  <p className="truncate text-sm font-medium text-slate-100">
                    {symbol.name}
                  </p>
                  <p className="mt-1 text-xs text-violet-300">
                    {symbol.kind} · line {symbol.line}
                  </p>
                </button>
              ))}
              {!loadingSymbols && visibleSymbols.length === 0 && (
                <p className="p-5 text-center text-sm text-slate-500">
                  No loaded symbols match.
                </p>
              )}
              {loadingSymbols && <LoadingLabel label="Loading symbols" />}
            </div>
            {symbolCursor && (
              <PaginationButton
                label="Load more symbols"
                loading={loadingSymbols}
                onClick={() => void loadSymbols(symbolCursor)}
              />
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-6">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-emerald-300" />
              <h2 className="font-semibold text-white">Symbol intelligence</h2>
            </div>
            {detail ? (
              <div className="mt-6 space-y-6 text-sm">
                <div>
                  <p className="text-xl font-semibold text-white">
                    {detail.name}
                  </p>
                  <p className="mt-1 break-all text-violet-300">
                    {detail.qualifiedName}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                    {detail.kind}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source evidence
                  </p>
                  <p className="mt-2 break-all text-slate-200">
                    {detail.file.path}:{detail.line}
                  </p>
                  <p className="mt-1 text-xs text-cyan-300">
                    {detail.file.language}
                  </p>
                </div>
                <RelationshipList detail={detail} />
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center text-center">
                <div>
                  <Sparkles className="mx-auto size-7 text-violet-300" />
                  <p className="mt-4 font-medium text-slate-200">
                    Select a symbol to inspect it
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Ariadne will show its source evidence and only the
                    relationships extracted from analysis.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function RelationshipList({ detail }: { readonly detail: Detail }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Verified relationships
      </p>
      <div className="mt-3 space-y-2">
        {detail.relationships.slice(0, 12).map((relationship) => (
          <div
            key={relationship.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2 text-slate-200"
          >
            <span>{relationship.kind}</span>
            <span className="text-xs text-slate-500">
              {Math.round(relationship.confidence * 100)}% confidence
            </span>
          </div>
        ))}
        {!detail.relationships.length && (
          <p className="text-sm text-slate-500">
            No verified relationships for this symbol yet.
          </p>
        )}
      </div>
      {!!detail.related.length && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Related symbols
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.related.slice(0, 16).map((symbol) => (
              <span
                key={symbol.id}
                className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200"
              >
                {symbol.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingLabel({ label }: { readonly label: string }) {
  return (
    <p className="flex items-center justify-center gap-2 p-5 text-sm text-slate-500">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </p>
  );
}

function PaginationButton({
  label,
  loading,
  onClick,
}: {
  readonly label: string;
  readonly loading: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 border-t border-slate-800 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/[0.04] disabled:opacity-50"
    >
      <ChevronRight className="size-4" />
      {loading ? "Loading…" : label}
    </button>
  );
}
