"use client";
import { usePathname } from "next/navigation";
const items = [
  { href: "/", label: "Dashboard" },
  { href: "/repositories", label: "Repositories" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
] as const;
export function ApplicationNavigation() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-slate-800 bg-slate-950 p-5 md:block">
      <Link href="/" className="mb-9 block text-lg font-semibold text-white">
        Ariadne
      </Link>
      <nav className="space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-10 text-xs leading-5 text-slate-600">
        Knowledge, architecture, and AI are available within each repository
        workspace.
      </p>
    </aside>
  );
}
import Link from "next/link";
