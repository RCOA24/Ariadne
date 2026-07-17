"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Boxes, FileCode2, Network, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  id: string; name: string; description?: string; status: string; analysisStatus?: string; primaryLanguage: string; framework?: string; architecture: string; technologies: string[];
  metrics: Record<string, number | string>;
  map: { name: string; files: number; folders: string[]; dependencies: number }[];
  hotspots: { title: string; entries: { name: string; value: number; detail: string }[] }[];
  firstSteps: { title: string; detail: string; href: string }[];
};

type Briefing = {
  overview: string[]; size: string[]; health: { score: number; label: string };
  startHere: { title: string; detail: string; href: string }[]; estimatedOnboarding: string;
};

const primaryMetrics = ["LOC", "Total files", "Classes", "Interfaces", "Methods", "Dependencies", "Unused files", "Circular dependencies", "Average complexity"];

function Count({ value }: { readonly value: number | string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced || typeof value !== "number" ? value : 0);
  useEffect(() => {
    if (typeof value !== "number" || reduced) return;
    const started = performance.now();
    const frame = (now: number) => {
      const progress = Math.min(1, (now - started) / 650);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [value, reduced]);
  return <>{typeof shown === "number" ? shown.toLocaleString() : shown}</>;
}

function OverviewSkeleton() {
  return <div className="space-y-5"><div className="skeleton h-48" /><div className="grid gap-4 sm:grid-cols-3"><div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" /></div><div className="grid gap-5 lg:grid-cols-3"><div className="skeleton h-80 lg:col-span-2" /><div className="skeleton h-80" /></div></div>;
}

export function RepositoryDetails({ id }: { readonly id: string }) {
  const [overview, setOverview] = useState<Overview>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    fetch(`/api/repositories/${id}/overview`).then(async (response) => response.ok ? setOverview(await response.json()) : setError("Repository could not be loaded.")).catch(() => setError("Repository could not be loaded."));
  }, [id]);
  if (error) return <p className="py-16 text-rose-300">{error}</p>;
  if (!overview) return <OverviewSkeleton />;
  const analyzing = overview.status === "IMPORTING" || overview.status === "PENDING_IMPORT" || overview.analysisStatus === "RUNNING" || overview.analysisStatus === "PENDING";
  if (analyzing) return <AnalysisPending id={id} name={overview.name} />;
  return <RepositoryOverview overview={overview} />;
}

function AnalysisPending({ id, name }: { readonly id: string; readonly name: string }) {
  return <section className="relative overflow-hidden rounded-[24px] border border-cyan-400/15 bg-slate-900/65 p-7 sm:p-10"><motion.div animate={{ x: ["-100%", "220%"] }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent" /><p className="eyebrow">Repository overview</p><h1 className="page-title mt-2">Ariadne is mapping {name}.</h1><p className="muted mt-3 max-w-xl">The dashboard will fill in as soon as source files, symbols, and verified relationships are available. No empty screens—just a clear analysis path.</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{["Scanning files", "Extracting symbols", "Mapping architecture"].map((step, index) => <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .12 }} className="rounded-xl border border-white/[.07] bg-white/[.035] p-4"><div className="mb-4 h-2 w-2 rounded-full bg-cyan-300 animate-pulse" /><p className="text-sm font-medium text-slate-200">{step}</p><div className="skeleton mt-3 h-2 w-full" /></motion.div>)}</div><Link href={`/repositories/${id}/files`} className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">View imported files <ArrowRight className="size-4" /></Link></section>;
}

function RepositoryOverview({ overview }: { readonly overview: Overview }) {
  const reduced = useReducedMotion();
  return <div className="space-y-5 pb-10">
    <motion.section initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[24px] border border-violet-400/15 bg-gradient-to-br from-violet-500/[.14] via-slate-900/75 to-cyan-400/[.07] p-7 sm:p-10">
      <div className="absolute right-0 top-0 size-64 rounded-full bg-violet-400/10 blur-3xl" /><p className="eyebrow">Repository intelligence</p><div className="relative mt-3 flex flex-wrap items-start justify-between gap-6"><div><h1 className="page-title">{overview.name}</h1><p className="muted mt-3 max-w-2xl">{overview.description ?? "A mapped codebase ready for fast, confident exploration."}</p></div><span className="status-chip bg-emerald-400/10 text-emerald-200">Architecture ready</span></div>
      <div className="relative mt-7 flex flex-wrap gap-2">{overview.technologies.length ? overview.technologies.map((tech, index) => <motion.span key={tech} initial={reduced ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .12 + index * .05 }} className="rounded-full border border-cyan-300/15 bg-cyan-300/[.08] px-3 py-1.5 text-sm text-cyan-100">{tech}</motion.span>) : <span className="text-sm text-slate-500">Technology detection is not available for this import.</span>}</div>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-3"><HeroFact label="Primary language" value={overview.primaryLanguage} /><HeroFact label="Framework" value={overview.framework ?? "Not detected"} /><HeroFact label="Architecture style" value={overview.architecture} /></div>
    </motion.section>
    <RepositoryBriefing id={overview.id} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{primaryMetrics.map((metric, index) => <motion.div key={metric} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }} className="ariadne-panel p-4"><p className="text-xs font-medium uppercase tracking-[.12em] text-slate-500">{metric}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-100"><Count value={overview.metrics[metric] ?? 0} /></p></motion.div>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]"><div className="ariadne-panel p-6"><div className="flex items-center gap-2"><Boxes className="size-4 text-violet-300" /><div><p className="eyebrow">Repository map</p><h2 className="mt-1 text-xl font-semibold">How the codebase is organized</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{overview.map.length ? overview.map.map((area) => <div key={area.name} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between"><p className="font-medium text-slate-100">{area.name}</p><span className="text-sm text-cyan-200">{area.files} files</span></div><p className="mt-3 text-xs text-slate-500">{area.folders.join(" · ") || "Mapped source area"}</p><p className="mt-2 text-xs text-slate-400">{area.dependencies} outgoing dependencies</p></div>) : <p className="muted">No standard source areas were detected. Browse the repository tree to orient yourself.</p>}</div></div><div className="ariadne-panel p-6"><p className="eyebrow">Repository profile</p><div className="mt-5 space-y-4">{["Repository size", "Directories", "Largest folder", "Largest file"].map((metric) => <div key={metric}><p className="text-xs text-slate-500">{metric}</p><p className="mt-1 break-all text-sm font-medium text-slate-200">{overview.metrics[metric]}</p></div>)}</div></div></section>
    <section className="ariadne-panel p-6"><div className="flex items-center gap-2"><Network className="size-4 text-cyan-300" /><div><p className="eyebrow">Hotspots</p><h2 className="mt-1 text-xl font-semibold">Where attention will pay off first</h2></div></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{overview.hotspots.map((group) => <div key={group.title} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-sm font-medium text-slate-100">{group.title}</p><div className="mt-3 space-y-3">{group.entries.length ? group.entries.map((entry, index) => <div key={`${entry.name}-${index}`} className="flex gap-3"><span className="text-xs text-violet-300">0{index + 1}</span><div className="min-w-0"><p className="truncate text-sm text-slate-300">{entry.name}</p><p className="text-xs text-slate-500">{entry.value} {entry.detail}</p></div></div>) : <p className="text-sm text-slate-500">No relationship data yet.</p>}</div></div>)}</div></section>
    <section className="ariadne-panel p-6"><div className="flex items-center gap-2"><Sparkles className="size-4 text-violet-300" /><div><p className="eyebrow">First steps</p><h2 className="mt-1 text-xl font-semibold">If you are new to this repository</h2></div></div><div className="mt-5 grid gap-3 lg:grid-cols-4">{overview.firstSteps.map((step, index) => <Link key={step.title} href={step.href as never} className="group rounded-xl border border-white/[.07] bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.06]"><p className="text-xs font-bold text-cyan-300">0{index + 1}</p><p className="mt-3 font-medium text-slate-100">{step.title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{step.detail}</p><FileCode2 className="mt-4 size-4 text-slate-500 transition group-hover:text-cyan-200" /></Link>)}</div></section>
  </div>;
}

function RepositoryBriefing({ id }: { readonly id: string }) {
  const [briefing, setBriefing] = useState<Briefing>();
  useEffect(() => { fetch(`/api/repositories/${id}/briefing`).then((response) => response.ok ? response.json() : undefined).then(setBriefing).catch(() => undefined); }, [id]);
  if (!briefing) return <section className="ariadne-panel overflow-hidden p-6"><div className="skeleton h-5 w-48" /><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="skeleton h-16" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div></section>;
  return <section className="relative overflow-hidden rounded-[24px] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[.10] via-slate-900/70 to-violet-500/[.12] p-6 sm:p-7"><div className="absolute right-0 top-0 size-48 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Repository briefing</p><h2 className="mt-1 text-xl font-semibold text-slate-100">Welcome to Ariadne.</h2><p className="mt-1 text-sm text-slate-400">Your repository is indexed and ready to explore.</p></div><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-right"><p className="text-2xl font-semibold text-emerald-200">{briefing.health.score}/100</p><p className="text-xs text-emerald-100/80">Architecture health</p></div></div><div className="relative mt-5 grid gap-3 md:grid-cols-3">{briefing.overview.map((item) => <div key={item} className="rounded-xl border border-white/[.08] bg-slate-950/20 px-4 py-3 text-sm text-slate-200">{item}</div>)}</div><div className="relative mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]"><div><p className="text-xs font-medium uppercase tracking-[.12em] text-slate-500">Repository size</p><div className="mt-2 flex flex-wrap gap-2">{briefing.size.map((item) => <span key={item} className="rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-sm text-slate-300">{item}</span>)}</div></div><div><p className="text-xs font-medium uppercase tracking-[.12em] text-slate-500">Start here · {briefing.estimatedOnboarding} to orient</p><div className="mt-2 flex flex-wrap gap-2">{briefing.startHere.slice(0, 3).map((step, index) => <Link key={step.title} href={step.href as never} className="text-sm text-cyan-200 hover:text-cyan-100">{index + 1}. {step.title}</Link>)}</div><p className="mt-2 text-xs text-slate-400">{briefing.health.label}</p></div></div></section>;
}

function HeroFact({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-slate-950/25 px-4 py-3"><p className="text-xs uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-100">{value}</p></div>;
}
