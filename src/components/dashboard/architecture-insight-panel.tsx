"use client";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
type Insight = {
  title: string;
  repositoryName?: string;
  summary: string;
  highlights: { tone: "success" | "warning" | "neutral"; text: string }[];
  recommendation: string;
  evidence: string[];
  generatedAt: string;
};
export function ArchitectureInsightPanel() {
  const [insight, setInsight] = useState<Insight>();
  const reduced = useReducedMotion();
  useEffect(() => {
    fetch("/api/insights/today").then(
      async (response) => response.ok && setInsight(await response.json()),
    );
  }, []);
  if (!insight)
    return (
      <section className="ariadne-panel min-h-64 p-6">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton mt-5 h-7 w-2/3" />
        <div className="skeleton mt-5 h-16 w-full" />
      </section>
    );
  return (
    <section className="ariadne-panel relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(124,92,252,.2),transparent_30%)] p-6">
      <motion.div
        animate={reduced ? {} : { opacity: [0.35, 0.8, 0.35] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute right-6 top-6 grid size-11 place-items-center rounded-2xl bg-violet-400/10 text-violet-200"
      >
        <Sparkles className="size-5" />
      </motion.div>
      <p className="eyebrow">{insight.title}</p>
      <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-white">
        {insight.summary}
      </h2>
      <div className="mt-6 space-y-3">
        {insight.highlights.map((item, index) => (
          <motion.div
            key={item.text}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.09 }}
            className={`flex items-center gap-2 text-sm ${item.tone === "warning" ? "text-amber-200" : "text-slate-300"}`}
          >
            {item.tone === "warning" ? (
              <AlertTriangle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-300" />
            )}
            {item.text}
          </motion.div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-violet-400/15 bg-violet-400/[.06] p-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-violet-200">
          Recommended next action
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-200">
          {insight.recommendation}
        </p>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Grounded in the latest repository analysis ·{" "}
        {new Date(insight.generatedAt).toLocaleTimeString()}
      </p>
    </section>
  );
}
