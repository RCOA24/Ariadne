"use client";
import { useEffect, useState } from "react";
type FileDetail = {
  path: string;
  language: string;
  size: number;
  symbols: { id: string; name: string; kind: string; line: number }[];
};
export function FileViewer({
  repositoryId,
  fileId,
}: {
  readonly repositoryId: string;
  readonly fileId: string;
}) {
  const [file, setFile] = useState<FileDetail>();
  useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/files/${fileId}`).then(
      async (r) => r.ok && setFile(await r.json()),
    );
  }, [repositoryId, fileId]);
  if (!file)
    return <p className="py-8 text-slate-400">Loading file metadata…</p>;
  return (
    <section className="py-7">
      <h1 className="text-2xl font-semibold text-white">
        {file.path.split("/").at(-1)}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {file.path} · {file.language} · {file.size.toLocaleString()} bytes
      </p>
      <div className="mt-6 rounded-xl border border-slate-800 p-5">
        <h2 className="font-medium text-white">Detected symbols</h2>
        {file.symbols.length ? (
          <ul className="mt-3 space-y-2">
            {file.symbols.map((symbol) => (
              <li key={symbol.id} className="text-sm text-slate-300">
                {symbol.name}{" "}
                <span className="text-cyan-300">{symbol.kind}</span> · line{" "}
                {symbol.line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            No symbols were detected.
          </p>
        )}
      </div>
      <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">
        Source-code rendering and AI explanation are deliberately deferred until
        source snapshots are persisted securely.
      </div>
    </section>
  );
}
