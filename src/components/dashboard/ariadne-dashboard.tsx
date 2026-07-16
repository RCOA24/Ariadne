"use client";
import { Activity, ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  InsightPanel,
  StatusChip,
} from "@/components/ui/experience-primitives";
import { RepositoryConstellation } from "./repository-constellation";
import { ArchitectureInsightPanel } from "./architecture-insight-panel";
type Data = {
  repositoryCount: number;
  analysisStatus: Record<string, number>;
  languages: { name: string; count: number }[];
  frameworks: { name: string; count: number }[];
  architectureComplexity: number;
  largestModules: { name: string; files: number }[];
  recentlyAnalyzed: {
    id: string;
    name: string;
    status: string;
    analyzedAt?: string;
  }[];
};
export function AriadneDashboard() {
  const [data, setData] = useState<Data>();
  useEffect(() => {
    fetch("/api/dashboard").then(
      async (response) => response.ok && setData(await response.json()),
    );
  }, []);
  if (!data)
    return (
      <main className="mx-auto max-w-7xl p-8">
        <div className="skeleton h-10 w-64" />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
      </main>
    );
  const health = Math.max(0, 100 - data.architectureComplexity);
  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Architecture intelligence</p>
          <h1 className="page-title mt-2">
            Navigate complexity with a thread of clarity.
          </h1>
          <p className="muted mt-3 max-w-2xl">
            Ariadne reveals the systems, dependencies, and risks hidden inside
            your legacy codebase.
          </p>
        </div>
        <Link
          href="/repositories"
          className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5"
        >
          Import repository <ArrowRight className="ml-1 inline size-4" />
        </Link>
      </div>
      <div className="mt-8">
        <ArchitectureInsightPanel />
      </div>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <InsightPanel
          eyebrow="Repository health"
          title={`${health}/100`}
          accent="green"
        >
          <p className="muted">
            Derived from architecture complexity and analyzed dependency
            density.
          </p>
          <div className="mt-5 h-2 rounded-full bg-emerald-950">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${health}%` }}
            />
          </div>
        </InsightPanel>
        <InsightPanel
          eyebrow="Architecture signal"
          title={`${data.architectureComplexity}/100`}
        >
          <p className="muted">
            Complexity rises with structural coupling. Explore the graph to
            isolate pressure points.
          </p>
          <Link
            href="/repositories"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-300"
          >
            Open architecture <NetworkIcon />
          </Link>
        </InsightPanel>
        <InsightPanel
          eyebrow="AI mission control"
          title="Grounded by design"
          accent="cyan"
        >
          <p className="muted">
            Every answer is bound to repository knowledge and citations—never
            guesswork.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-cyan-200">
            <BrainCircuit className="size-4" />
            Provider configuration required
          </div>
        </InsightPanel>
      </section>
      <div className="mt-5">
        <RepositoryConstellation repositories={data.recentlyAnalyzed} />
      </div>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="ariadne-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Recent systems</p>
              <h2 className="mt-1 text-xl font-semibold">
                Your repository constellation
              </h2>
            </div>
            <span className="status-chip bg-violet-400/10 text-violet-200">
              {data.repositoryCount} tracked
            </span>
          </div>
          <div className="mt-5 divide-y divide-white/[.06]">
            {data.recentlyAnalyzed.length ? (
              data.recentlyAnalyzed.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repositories/${repo.id}` as never}
                  className="flex items-center justify-between gap-4 py-4 transition hover:px-2"
                >
                  <div>
                    <p className="font-medium text-slate-100">{repo.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {repo.analyzedAt
                        ? `Analyzed ${new Date(repo.analyzedAt).toLocaleDateString()}`
                        : "Awaiting analysis"}
                    </p>
                  </div>
                  <StatusChip status={repo.status} />
                </Link>
              ))
            ) : (
              <p className="py-8 text-sm text-slate-500">
                Import a repository to begin tracing its architecture.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div className="ariadne-panel p-6">
            <p className="eyebrow">Technology stack</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.frameworks.length ? (
                data.frameworks.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-lg bg-cyan-400/10 px-2.5 py-1.5 text-sm text-cyan-200"
                  >
                    {item.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  Detected frameworks will appear after import.
                </span>
              )}
            </div>
          </div>
          <div className="ariadne-panel p-6">
            <p className="eyebrow">Active analyses</p>
            <div className="mt-4 space-y-3">
              {Object.entries(data.analysisStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize text-slate-300">{status}</span>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(data.analysisStatus).length === 0 && (
                <p className="text-sm text-slate-500">
                  No analysis activity yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-5 ariadne-panel p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-300" />
          <p className="eyebrow">Quick actions</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [
              "Explore knowledge",
              "Browse classes, interfaces, and relationships",
              "/repositories",
            ],
            [
              "Search everything",
              "Find systems, symbols, and database objects",
              "/search",
            ],
            ["Configure AI", "Set a grounded provider and model", "/settings"],
          ].map(([title, detail, href]) => (
            <Link
              key={title}
              href={href as never}
              className="rounded-xl bg-white/[.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.07]"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
function NetworkIcon() {
  return <Activity className="size-4" />;
}
