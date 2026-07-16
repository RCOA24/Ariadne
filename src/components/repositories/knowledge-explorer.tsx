"use client";
import { useEffect, useState } from "react";
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
export function KnowledgeExplorer({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [detail, setDetail] = useState<Detail>();
  const [kind, setKind] = useState("");
  const [error, setError] = useState<string>();
  useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/knowledge`).then(async (r) =>
      r.ok
        ? setFiles((await r.json()).items)
        : setError("Knowledge has not been generated yet."),
    );
  }, [repositoryId]);
  useEffect(() => {
    fetch(
      `/api/repositories/${repositoryId}/knowledge?view=symbols${kind ? `&kind=${kind}` : ""}`,
    ).then(async (r) => r.ok && setSymbols((await r.json()).items));
  }, [repositoryId, kind]);
  const select = async (id: string) => {
    const r = await fetch(
      `/api/repositories/${repositoryId}/knowledge/symbols/${id}`,
    );
    if (r.ok) setDetail(await r.json());
  };
  return (
    <main className="mx-auto min-h-screen max-w-7xl p-8">
      <h1 className="text-3xl font-semibold text-white">
        Repository Knowledge Explorer
      </h1>
      <p className="mt-2 text-slate-400">
        Browse structured knowledge produced by analysis. No AI-generated
        content is displayed.
      </p>
      {error ? (
        <p className="mt-8 text-amber-300">{error}</p>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr_1.2fr]">
          <section className="rounded-xl border border-slate-800 p-4">
            <h2 className="font-medium text-white">Files</h2>
            <div className="mt-3 max-h-[65vh] overflow-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border-b border-slate-800 py-2 text-sm"
                >
                  <p className="truncate text-slate-200">{file.path}</p>
                  <span className="text-xs text-cyan-300">{file.language}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-slate-800 p-4">
            <div className="flex justify-between">
              <h2 className="font-medium text-white">Symbols</h2>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="bg-slate-950 text-sm"
              >
                <option value="">All</option>
                <option value="class">Classes</option>
                <option value="interface">Interfaces</option>
                <option value="function">Services / functions</option>
                <option value="method">Methods</option>
              </select>
            </div>
            <div className="mt-3 max-h-[65vh] overflow-auto">
              {symbols.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => void select(symbol.id)}
                  className="block w-full border-b border-slate-800 py-2 text-left text-sm hover:bg-slate-900"
                >
                  <p className="text-slate-200">{symbol.name}</p>
                  <span className="text-xs text-cyan-300">{symbol.kind}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-slate-800 p-5">
            <h2 className="font-medium text-white">Details</h2>
            {detail ? (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xl text-white">{detail.name}</p>
                  <p className="text-cyan-300">
                    {detail.kind} · {detail.qualifiedName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Source reference</p>
                  <p className="text-slate-200">
                    {detail.file.path}:{detail.line}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Relationships</p>
                  {detail.relationships.map((item) => (
                    <p key={item.id} className="text-slate-200">
                      {item.kind}{" "}
                      <span className="text-slate-500">
                        ({Math.round(item.confidence * 100)}% confidence)
                      </span>
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-slate-500">Related symbols</p>
                  {detail.related.map((item) => (
                    <p key={item.id} className="text-slate-200">
                      {item.name}{" "}
                      <span className="text-cyan-300">{item.kind}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Select a symbol to inspect its source reference and
                relationships.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
