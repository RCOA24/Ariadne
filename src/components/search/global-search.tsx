"use client";
import { FormEvent, useState } from "react";
type Result = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  repositoryId: string;
  score: number;
  language?: string;
  symbolType?: string;
};
export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [language, setLanguage] = useState("");
  const [kind, setKind] = useState("");
  const run = async (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ q: query });
    if (language) params.set("language", language);
    if (kind) params.set("symbolType", kind);
    const response = await fetch(`/api/search?${params}`);
    if (response.ok) setResults(await response.json());
  };
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-semibold text-white">Global Search</h1>
      <p className="mt-2 text-slate-400">
        Find files, classes, methods, database objects, APIs, and business
        concepts in analyzed repositories.
      </p>
      <form onSubmit={run} className="mt-7 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          placeholder="Search legacy-system knowledge"
          className="min-w-64 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg bg-slate-900 px-3"
        >
          <option value="">All languages</option>
          <option>TypeScript</option>
          <option>JavaScript</option>
          <option>C#</option>
          <option>SQL</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-lg bg-slate-900 px-3"
        >
          <option value="">All types</option>
          <option value="class">Classes</option>
          <option value="interface">Interfaces</option>
          <option value="method">Methods</option>
          <option value="database-object">Database tables</option>
        </select>
        <button className="rounded-lg bg-cyan-400 px-4 font-semibold text-slate-950">
          Search
        </button>
      </form>
      <div className="mt-8 divide-y divide-slate-800 rounded-xl border border-slate-800">
        {results.map((result) => (
          <a
            key={`${result.type}:${result.id}`}
            href={
              result.type === "symbol"
                ? `/repositories/${result.repositoryId}/knowledge`
                : `/repositories/${result.repositoryId}/knowledge`
            }
            className="block p-4 hover:bg-slate-900"
          >
            <div className="flex justify-between">
              <p className="font-medium text-cyan-300">{result.title}</p>
              <span className="text-xs text-slate-500">{result.type}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{result.subtitle}</p>
          </a>
        ))}
        {results.length === 0 && (
          <p className="p-5 text-sm text-slate-500">
            Enter a search query to explore analyzed knowledge.
          </p>
        )}
      </div>
    </main>
  );
}
