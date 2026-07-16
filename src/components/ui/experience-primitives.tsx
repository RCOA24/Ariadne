import type { ReactNode } from "react";
export function InsightPanel({
  eyebrow,
  title,
  children,
  accent = "violet",
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly accent?: "violet" | "cyan" | "green";
}) {
  const colors = {
    violet: "from-violet-500/20 to-violet-500/0",
    cyan: "from-cyan-400/15 to-cyan-400/0",
    green: "from-emerald-400/15 to-emerald-400/0",
  };
  return (
    <section
      className={`ariadne-panel relative overflow-hidden bg-gradient-to-br p-6 ${colors[accent]}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
export function StatusChip({ status }: { readonly status: string }) {
  const color = /complete|ready|healthy/i.test(status)
    ? "bg-emerald-400/10 text-emerald-300"
    : /fail|error/i.test(status)
      ? "bg-rose-400/10 text-rose-300"
      : /running|import/i.test(status)
        ? "bg-amber-400/10 text-amber-200"
        : "bg-slate-400/10 text-slate-300";
  return (
    <span className={`status-chip ${color}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
export function EmptyState({
  title,
  detail,
}: {
  readonly title: string;
  readonly detail: string;
}) {
  return (
    <div className="ariadne-panel grid min-h-48 place-items-center p-8 text-center">
      <div>
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mx-auto mt-2 max-w-md muted">{detail}</p>
      </div>
    </div>
  );
}
