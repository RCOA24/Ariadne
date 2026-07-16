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

type ImportProgress = {
  status: string;
  currentStep: string;
  progress: number;
  errorMessage?: string;
};

export function RepositoryDetails({ id }: { readonly id: string }) {
  const [repository, setRepository] = useState<Repository>();
  const [error, setError] = useState<string>();
  const [job, setJob] = useState<ImportProgress>();
  const [isStarting, setIsStarting] = useState(false);

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
    if (isStarting) return;

    setIsStarting(true);
    setError(undefined);
    setJob({
      status: "running",
      currentStep: "Importing repository and building software knowledge",
      progress: 5,
    });

    try {
      const response = await fetch(`/api/repositories/${id}/import`, {
        method: "POST",
        headers: { "x-ariadne-owner-id": "local-development" },
      });
      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.error ?? result.import?.errorMessage ?? "Import failed.";
        setError(errorMessage);
        setJob({
          status: "failed",
          currentStep: "Import failed",
          progress: 0,
          errorMessage,
        });
        return;
      }

      setJob(result.analysis ?? result.import);
    } catch {
      setError("Ariadne could not start the import. Please try again.");
      setJob({
        status: "failed",
        currentStep: "Import could not be started",
        progress: 0,
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (error && !repository) {
    return (
      <main className="mx-auto max-w-3xl p-12">
        <Link href="/repositories" className="text-cyan-300">
          ← Repositories
        </Link>
        <p className="mt-8 text-rose-300">{error}</p>
      </main>
    );
  }

  if (!repository) {
    return <main className="p-12 text-slate-400">Loading repository…</main>;
  }

  const isRunning = isStarting || job?.status === "running";

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-12">
      <Link href="/repositories" className="text-sm text-cyan-300">
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
        <h2 className="font-medium text-white">Analysis progress</h2>
        {job ? (
          <>
            <p className="mt-3 text-sm text-slate-300">
              {job.currentStep} · {job.progress}%
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            {job.errorMessage && (
              <p className="mt-3 text-sm text-rose-300">{job.errorMessage}</p>
            )}
            {job.status === "completed" && (
              <p className="mt-3 text-sm text-emerald-300">
                Analysis is complete. Browse the workspace views to explore the
                generated files, symbols, relationships, and architecture.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Ariadne acquires the workspace, scans technologies, extracts
            symbols, and maps verified relationships.
          </p>
        )}

        <button
          onClick={() => void startImport()}
          disabled={isRunning}
          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning
            ? "Analyzing repository…"
            : job?.status === "completed"
              ? "Re-analyze repository"
              : job?.status === "failed"
                ? "Retry import and analysis"
                : "Import and analyze repository"}
        </button>
      </section>
    </main>
  );
}
