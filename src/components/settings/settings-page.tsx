"use client";
import { FormEvent, useEffect, useState } from "react";
type Settings = {
  preferences: { theme: string; locale: string };
  ai: {
    provider?: string;
    model?: string;
    temperature: number;
    maxTokens: number;
    configured: boolean;
  };
  repositoryDefaults: { defaultBranch?: string };
  analysisConfiguration: {
    ignoredFolders: string[];
    supportedLanguages: string[];
  };
  storageConfiguration: { workspaceRetentionDays: number };
};
export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/settings", {
      headers: { "x-ariadne-owner-id": "local-development" },
    }).then(async (r) => r.ok && setSettings(await r.json()));
  }, []);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const data = new FormData(event.currentTarget);
    const payload = {
      ...settings,
      ai: {
        ...settings.ai,
        provider: data.get("provider") || undefined,
        model: data.get("model") || undefined,
        temperature: Number(data.get("temperature")),
        maxTokens: Number(data.get("maxTokens")),
        apiKey: data.get("apiKey") || undefined,
      },
      repositoryDefaults: { defaultBranch: data.get("branch") || undefined },
      analysisConfiguration: {
        ...settings.analysisConfiguration,
        ignoredFolders: String(data.get("ignored"))
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      },
      storageConfiguration: {
        workspaceRetentionDays: Number(data.get("retention")),
      },
    };
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-ariadne-owner-id": "local-development",
      },
      body: JSON.stringify(payload),
    });
    setMessage(r.ok ? "Settings saved." : (await r.json()).error);
    if (r.ok) setSettings(await r.json());
  };
  if (!settings)
    return <main className="p-8 text-slate-400">Loading settings…</main>;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">System Settings</h1>
      <form onSubmit={save} className="mt-8 space-y-5">
        <section className="rounded-xl border border-slate-800 p-5">
          <h2 className="text-lg text-white">Account</h2>
          <input
            defaultValue={settings.preferences.locale}
            className="mt-3 rounded bg-slate-950 p-2"
            readOnly
          />
        </section>
        <section className="rounded-xl border border-slate-800 p-5">
          <h2 className="text-lg text-white">AI Configuration</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provider secrets are encrypted and never returned after saving.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              name="provider"
              defaultValue={settings.ai.provider}
              placeholder="Provider (openai, anthropic…)"
              className="rounded bg-slate-950 p-2"
            />
            <input
              name="model"
              defaultValue={settings.ai.model}
              placeholder="Model"
              className="rounded bg-slate-950 p-2"
            />
            <input
              name="temperature"
              type="number"
              step="0.1"
              defaultValue={settings.ai.temperature}
              className="rounded bg-slate-950 p-2"
            />
            <input
              name="maxTokens"
              type="number"
              defaultValue={settings.ai.maxTokens}
              className="rounded bg-slate-950 p-2"
            />
            <input
              name="apiKey"
              type="password"
              placeholder={
                settings.ai.configured
                  ? "API key configured — enter to replace"
                  : "API key"
              }
              className="rounded bg-slate-950 p-2 md:col-span-2"
            />
          </div>
        </section>
        <section className="rounded-xl border border-slate-800 p-5">
          <h2 className="text-lg text-white">Analysis Settings</h2>
          <input
            name="ignored"
            defaultValue={settings.analysisConfiguration.ignoredFolders.join(
              ", ",
            )}
            className="mt-3 w-full rounded bg-slate-950 p-2"
          />
          <p className="mt-1 text-xs text-slate-500">
            Comma-separated ignored folders
          </p>
        </section>
        <section className="rounded-xl border border-slate-800 p-5">
          <h2 className="text-lg text-white">Repository & Storage</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              name="branch"
              defaultValue={settings.repositoryDefaults.defaultBranch}
              placeholder="Default branch"
              className="rounded bg-slate-950 p-2"
            />
            <input
              name="retention"
              type="number"
              defaultValue={
                settings.storageConfiguration.workspaceRetentionDays
              }
              className="rounded bg-slate-950 p-2"
            />
          </div>
        </section>
        <button className="rounded bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
          Save settings
        </button>
        {message && (
          <span className="ml-3 text-sm text-cyan-300">{message}</span>
        )}
      </form>
    </main>
  );
}
