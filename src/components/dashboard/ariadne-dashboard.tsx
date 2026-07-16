"use client";
import { useEffect, useState } from "react";
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
const Bar = ({ value, max }: { value: number; max: number }) => (
  <div className="h-2 flex-1 rounded bg-slate-800">
    <div
      className="h-full rounded bg-cyan-400"
      style={{ width: `${max ? (value / max) * 100 : 0}%` }}
    />
  </div>
);
export function AriadneDashboard() {
  const [data, setData] = useState<Data>();
  useEffect(() => {
    fetch("/api/dashboard").then(async (r) => r.ok && setData(await r.json()));
  }, []);
  if (!data)
    return <main className="p-10 text-slate-400">Loading dashboard…</main>;
  const maxLanguage = Math.max(1, ...data.languages.map((x) => x.count));
  const maxModule = Math.max(1, ...data.largestModules.map((x) => x.files));
  return (
    <main className="mx-auto max-w-7xl p-8">
      <h1 className="text-3xl font-semibold text-white">Ariadne Dashboard</h1>
      <p className="mt-2 text-slate-400">
        System inventory and architecture health at a glance.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 p-5">
          <p className="text-sm text-slate-500">Repositories</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {data.repositoryCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 p-5">
          <p className="text-sm text-slate-500">Architecture complexity</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">
            {data.architectureComplexity}
            <span className="text-base text-slate-500"> / 100</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 p-5">
          <p className="text-sm text-slate-500">Analysis health</p>
          <div className="mt-3 flex gap-3 text-sm">
            {Object.entries(data.analysisStatus).map(([status, count]) => (
              <span key={status} className="text-slate-200">
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 p-5">
          <h2 className="font-medium text-white">Programming languages</h2>
          <div className="mt-4 space-y-3">
            {data.languages.map((item) => (
              <div key={item.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-slate-300">{item.name}</span>
                <Bar value={item.count} max={maxLanguage} />
                <span className="text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-7 font-medium text-white">Framework detection</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.frameworks.map((item) => (
              <span
                key={item.name}
                className="rounded-full bg-slate-800 px-3 py-1 text-sm text-cyan-300"
              >
                {item.name} · {item.count}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 p-5">
          <h2 className="font-medium text-white">Largest modules</h2>
          <div className="mt-4 space-y-3">
            {data.largestModules.map((item) => (
              <div key={item.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 truncate text-slate-300">
                  {item.name}
                </span>
                <Bar value={item.files} max={maxModule} />
                <span className="text-slate-500">{item.files} files</span>
              </div>
            ))}
          </div>
          <h2 className="mt-7 font-medium text-white">Recently analyzed</h2>
          <div className="mt-3 space-y-2">
            {data.recentlyAnalyzed.map((repo) => (
              <a
                key={repo.id}
                href={`/repositories/${repo.id}`}
                className="flex justify-between text-sm hover:text-cyan-300"
              >
                <span>{repo.name}</span>
                <span className="text-slate-500">{repo.status}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
