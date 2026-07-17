"use client";
import Link from "next/link";
import {
  Bot,
  Boxes,
  Compass,
  FileSearch,
  LayoutDashboard,
  Network,
  Settings,
  Workflow,
} from "lucide-react";
import { usePathname } from "next/navigation";
const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: Boxes },
  { href: "/search", label: "Search", icon: FileSearch },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
export function ApplicationNavigation() {
  const path = usePathname();
  return (
    <aside className="app-navigation sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/[.06] bg-[#0c1224]/80 p-5 backdrop-blur-xl md:block">
      <Link
        href="/"
        className="mb-10 flex items-center gap-3 px-2 text-lg font-semibold text-white"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
          <Compass className="size-5" />
        </span>
        Ariadne
      </Link>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">
        Workspace
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/" ? path === "/" : path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20" : "text-slate-400 hover:bg-white/[.045] hover:text-white"}`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-9 space-y-1 border-t border-white/[.06] pt-5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">
          Intelligence
        </p>
        {[
          [Network, "Architecture"],
          [Workflow, "Background Jobs"],
          [Bot, "AI Mission Control"],
        ].map(([Icon, label]) => {
          const Glyph = Icon as typeof Network;
          return (
            <span
              key={String(label)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500"
            >
              <Glyph className="size-4" />
              {String(label)}
            </span>
          );
        })}
      </div>
    </aside>
  );
}
