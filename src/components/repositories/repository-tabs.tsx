"use client";
import { usePathname } from "next/navigation";
const tabs = [
  { slug: "", label: "Overview" },
  { slug: "files", label: "Files" },
  { slug: "knowledge", label: "Knowledge Explorer" },
  { slug: "architecture", label: "Architecture" },
  { slug: "search", label: "Search" },
  { slug: "analysis", label: "Analysis" },
  { slug: "health", label: "Health" },
  { slug: "journey", label: "Developer Journey" },
  { slug: "chat", label: "AI Chat" },
  { slug: "settings", label: "Settings" },
];
export function RepositoryTabs({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const path = usePathname();
  const base = `/repositories/${repositoryId}`;
  return (
    <nav className="mt-7 flex gap-1 overflow-x-auto border-b border-slate-800">
      {tabs.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = path === href;
        return (
          <a
            key={tab.label}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${active ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500 hover:text-slate-200"}`}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
