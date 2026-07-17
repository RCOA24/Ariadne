"use client";
import { FormEvent, useEffect, useState } from "react";
type Settings = { preferences: { theme: string; locale: string }; ai: { provider?: string; model?: string; temperature: number; maxTokens: number; configured: boolean }; repositoryDefaults: { defaultBranch?: string }; analysisConfiguration: { ignoredFolders: string[]; supportedLanguages: string[] }; storageConfiguration: { workspaceRetentionDays: number } };
type AIHealth = { provider: string; model: string; reachable: boolean; latencyMs?: number; error?: string };
export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>();
  const [health, setHealth] = useState<AIHealth>();
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => { fetch("/api/settings", { headers: { "x-ariadne-owner-id": "local-development" } }).then(async (r) => r.ok && setSettings(await r.json())); }, []);
  const checkConnection = async () => {
    setChecking(true);
    try { const response = await fetch("/api/ai/health"); const result = await response.json() as AIHealth; setHealth(result); setMessage(result.reachable ? "Groq connection is healthy." : result.error ?? "Groq is unavailable."); }
    catch { setMessage("Groq health check could not be completed."); }
    finally { setChecking(false); }
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!settings) return;
    const data = new FormData(event.currentTarget);
    const payload = { ...settings, ai: { ...settings.ai, provider: data.get("provider") || undefined, model: data.get("model") || undefined, temperature: Number(data.get("temperature")), maxTokens: Number(data.get("maxTokens")) }, repositoryDefaults: { defaultBranch: data.get("branch") || undefined }, analysisConfiguration: { ...settings.analysisConfiguration, ignoredFolders: String(data.get("ignored")).split(",").map((x) => x.trim()).filter(Boolean) }, storageConfiguration: { workspaceRetentionDays: Number(data.get("retention")) } };
    const response = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json", "x-ariadne-owner-id": "local-development" }, body: JSON.stringify(payload) });
    setMessage(response.ok ? "Settings saved." : (await response.json()).error); if (response.ok) setSettings(await response.json());
  };
  if (!settings) return <main className="p-8 text-slate-400">Loading settings…</main>;
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-semibold text-white">System Settings</h1><form onSubmit={save} className="mt-8 space-y-5">
    <section className="rounded-xl border border-slate-800 p-5"><h2 className="text-lg text-white">AI Providers</h2><p className="mt-1 text-sm text-slate-500">Ariadne keeps provider secrets server-side and never returns them to the browser.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select name="provider" defaultValue={settings.ai.provider ?? "groq"} className="rounded bg-slate-950 p-2"><option value="groq">Groq</option><option value="openai">OpenAI (coming soon)</option><option value="gemini">Gemini (coming soon)</option><option value="ollama">Ollama (coming soon)</option></select><input name="model" defaultValue={settings.ai.model} placeholder="Model override (optional)" className="rounded bg-slate-950 p-2" /><input name="temperature" type="number" step="0.1" defaultValue={settings.ai.temperature} className="rounded bg-slate-950 p-2" /><input name="maxTokens" type="number" defaultValue={settings.ai.maxTokens} className="rounded bg-slate-950 p-2" /></div><div className="mt-5 rounded-lg border border-cyan-400/15 bg-cyan-400/[.04] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium text-slate-100">Groq connection</p><p className={`mt-1 text-sm ${health?.reachable ? "text-emerald-300" : "text-slate-500"}`}>{health ? health.reachable ? `Connected · ${health.model}${health.latencyMs ? ` · ${health.latencyMs}ms` : ""}` : health.error ?? "Unavailable" : "Not tested"}</p></div><button type="button" onClick={() => void checkConnection()} disabled={checking} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-sm text-cyan-200 disabled:opacity-50">{checking ? "Testing…" : "Test connection"}</button></div><p className="mt-3 text-xs text-slate-500">Set <code>GROQ_API_KEY</code> in the deployment environment or local <code>.env.local</code>. Keys are never displayed or saved through this form.</p></div></section>
    <section className="rounded-xl border border-slate-800 p-5"><h2 className="text-lg text-white">Analysis Settings</h2><input name="ignored" defaultValue={settings.analysisConfiguration.ignoredFolders.join(", ")} className="mt-3 w-full rounded bg-slate-950 p-2" /><p className="mt-1 text-xs text-slate-500">Comma-separated ignored folders</p></section>
    <section className="rounded-xl border border-slate-800 p-5"><h2 className="text-lg text-white">Repository & Storage</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><input name="branch" defaultValue={settings.repositoryDefaults.defaultBranch} placeholder="Default branch" className="rounded bg-slate-950 p-2" /><input name="retention" type="number" defaultValue={settings.storageConfiguration.workspaceRetentionDays} className="rounded bg-slate-950 p-2" /></div></section>
    <button className="rounded bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Save settings</button>{message && <span className="ml-3 text-sm text-cyan-300">{message}</span>}</form></main>;
}
