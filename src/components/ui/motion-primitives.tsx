"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({
  children,
  delay = 0,
}: {
  readonly children: ReactNode;
  readonly delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function ThreadPath({ steps }: { readonly steps: readonly string[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => (
        <span key={step} className="flex items-center gap-2">
          <motion.span
            initial={reduced ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.18 }}
            className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-100 shadow-[0_0_20px_rgba(124,92,252,.18)]"
          >
            {step}
          </motion.span>
          {index < steps.length - 1 && (
            <motion.span
              animate={reduced ? {} : { opacity: [0.25, 1, 0.25] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                delay: index * 0.1,
              }}
              className="text-cyan-300"
            >
              →
            </motion.span>
          )}
        </span>
      ))}
    </div>
  );
}
export function IntelligenceLoading() {
  const reduced = useReducedMotion();
  const steps = [
    "Scanning repository",
    "Detecting frameworks",
    "Extracting symbols",
    "Building architecture",
  ];
  return (
    <div className="ariadne-panel p-6">
      <p className="eyebrow">Ariadne at work</p>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 text-sm text-slate-300"
          >
            <motion.span
              animate={reduced ? {} : { opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.18,
              }}
              className="size-2 rounded-full bg-cyan-300"
            />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
