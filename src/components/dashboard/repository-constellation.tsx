"use client";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
type Repository = {
  readonly id: string;
  readonly name: string;
  readonly status: string;
};
const tint = (status: string) =>
  /fail/i.test(status)
    ? "from-rose-500 to-rose-300 shadow-rose-500/40"
    : /import|running/i.test(status)
      ? "from-cyan-500 to-blue-300 shadow-cyan-500/40"
      : /ready|complete/i.test(status)
        ? "from-emerald-500 to-cyan-300 shadow-emerald-500/40"
        : "from-amber-400 to-orange-300 shadow-amber-400/40";
export function RepositoryConstellation({
  repositories,
}: {
  readonly repositories: readonly Repository[];
}) {
  const reduced = useReducedMotion();
  return (
    <section className="ariadne-panel relative min-h-72 overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,92,252,.14),transparent_55%)]" />
      <p className="eyebrow relative">Repository constellation</p>
      <h2 className="relative mt-2 text-xl font-semibold">
        A living map of your systems
      </h2>
      {repositories.length ? (
        <div className="relative mt-7 flex min-h-40 flex-wrap items-center justify-center gap-7">
          {repositories.map((repository, index) => (
            <Link
              key={repository.id}
              href={`/repositories/${repository.id}` as never}
              className="group relative"
            >
              <motion.span
                animate={
                  reduced
                    ? {}
                    : {
                        y: [0, index % 2 ? -5 : 5, 0],
                        boxShadow: [
                          "0 0 12px rgba(124,92,252,.15)",
                          "0 0 28px rgba(124,92,252,.42)",
                          "0 0 12px rgba(124,92,252,.15)",
                        ],
                      }
                }
                transition={{
                  duration: 3 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`grid size-16 place-items-center rounded-full bg-gradient-to-br text-center text-xs font-semibold text-slate-950 shadow-xl transition group-hover:scale-110 ${tint(repository.status)}`}
              >
                {repository.name.slice(0, 2).toUpperCase()}
              </motion.span>
              <span className="absolute left-1/2 top-full mt-2 w-28 -translate-x-1/2 truncate text-center text-xs text-slate-300">
                {repository.name}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="relative mt-10 text-sm text-slate-500">
          Your imported repositories will appear here as living architecture
          maps.
        </p>
      )}
    </section>
  );
}
