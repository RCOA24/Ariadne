"use client";

import { useCallback, useState } from "react";
import { RepositoryExplainPanel } from "./repository-explain-panel";

export function RepositoryWorkspace({ repositoryId, children }: { readonly repositoryId: string; readonly children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(420);
  const onOpenChange = useCallback((open: boolean) => setPanelOpen(open), []);
  const onWidthChange = useCallback((width: number) => setPanelWidth(width), []);
  return <main className="repository-workspace mx-auto min-h-screen max-w-7xl px-6 py-8" data-ai-panel-open={panelOpen} style={{ "--ai-panel-width": `${panelWidth}px` } as React.CSSProperties}>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Repository workspace</p>
    {children}
    <RepositoryExplainPanel repositoryId={repositoryId} onOpenChange={onOpenChange} onWidthChange={onWidthChange} />
  </main>;
}
