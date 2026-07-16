"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Repository = {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  sourceLocation: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
export function RepositoryDetails({ id }: { readonly id: string }) {
  const [repository, setRepository] = useState<Repository>();
  const [error, setError] = useState<string>();
  const [job, setJob] = useState<{
    status: string;
    currentStep: string;
    progress: number;
    errorMessage?: string;
  }>();
  useEffect(() => {
    fetch(`/api/repositories/${id}`, {
      headers: { "x-ariadne-owner-id": "local-development" },
    })
      .then(async (response) =>
        response.ok
          ? setRepository(await response.json())
          : setError("Repository not found."),
      )
      .catch(() => setError("Repository could not be loaded."));
  }, [id]);
  const startImport = async () => {
    setError(undefined);
    const response = await fetch(`/api/repositories/${id}/import`, {
      method: "POST",
      headers: { "x-ariadne-owner-id": "local-development" },
    });
    const result = await response.json();
    if (!response.ok) setError(result.error);
    else setJob(result);
  };
  if (error)
    return (
      <main className="mx-auto max-w-3xl p-12">
        <Link href="/" className="text-cyan-300">
          ← Repositories
        </Link>
        <p className="mt-8 text-rose-300">{error}</p>
      </main>
    );
  if (!repository)
    return <main className="p-12 text-slate-400">Loading repository…</main>;
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-12">
      <Link href="/" className="text-sm text-cyan-300">
        ← Repositories
      </Link>
      <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        Repository details
      </p>
      <h1 className="mt-2 text-4xl font-semibold text-white">
        {repository.name}
      </h1>
      <dl className="mt-10 divide-y divide-slate-800 rounded-2xl border border-slate-800">
        {[
          ["Source", repository.sourceType],
          ["Location", repository.sourceLocation],
          ["Status", repository.status],
          ["Created", new Date(repository.createdAt).toLocaleString()],
          ["Last updated", new Date(repository.updatedAt).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 p-5">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="col-span-2 break-all text-sm text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section className="mt-8 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-medium text-white">Import progress</h2>
        {job ? (
          <>
            <p className="mt-3 text-sm text-slate-300">
              {job.currentStep} · {job.progress}%
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full bg-cyan-400"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            {job.errorMessage && (
              <p className="mt-3 text-sm text-rose-300">{job.errorMessage}</p>
            )}
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">
              Import scans the acquired workspace and records technology
              metadata. It does not analyze code.
            </p>
            <button
              onClick={() => void startImport()}
              className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Start import
            </button>
          </>
        )}
      </section>
    </main>
  );
}
