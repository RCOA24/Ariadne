"use client";
import cytoscape, { type Core, type EdgeSingular } from "cytoscape";
import {
  Focus,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Route,
  Search,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
type Graph = {
  nodes: { id: string; label: string; kind: string; layer: string }[];
  edges: { id: string; source: string; target: string; kind: string }[];
};
const colors: Record<string, string> = {
  presentation: "#38bdf8",
  application: "#a78bfa",
  domain: "#34d399",
  infrastructure: "#f59e0b",
  unknown: "#94a3b8",
};
export function ArchitectureVisualization({
  repositoryId,
}: {
  readonly repositoryId: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const [data, setData] = useState<Graph>();
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"cose" | "breadthfirst" | "concentric">(
    "cose",
  );
  const [selected, setSelected] = useState<Graph["nodes"][number]>();
  const [threading, setThreading] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const story = useMemo(() => {
    if (!data?.nodes.length) return [] as { node: Graph["nodes"][number]; edge?: Graph["edges"][number] }[];
    const start = selected ?? [...data.nodes].sort((left, right) => data.edges.filter((edge) => edge.source === right.id).length - data.edges.filter((edge) => edge.source === left.id).length)[0];
    const steps: { node: Graph["nodes"][number]; edge?: Graph["edges"][number] }[] = [{ node: start }];
    const seen = new Set([start.id]); let current = start.id;
    for (let index = 0; index < 6; index += 1) {
      const edge = data.edges.find((candidate) => candidate.source === current && !seen.has(candidate.target));
      if (!edge) break;
      const node = data.nodes.find((candidate) => candidate.id === edge.target);
      if (!node) break;
      steps.push({ node, edge }); seen.add(node.id); current = node.id;
    }
    return steps;
  }, [data, selected]);
  useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/architecture?limit=500`).then(
      async (response) => response.ok && setData(await response.json()),
    );
  }, [repositoryId]);
  useEffect(() => {
    if (!data || !host.current) return;
    cy.current?.destroy();
    const graph = cytoscape({
      container: host.current,
      elements: [
        ...data.nodes.map((node) => ({ data: node })),
        ...data.edges.map((edge) => ({ data: edge })),
      ],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": (node) =>
              colors[String(node.data("layer"))] ?? colors.unknown,
            color: "#e2e8f0",
            width: 28,
            height: 28,
            "font-size": 10,
            "text-valign": "bottom",
            "text-margin-y": 7,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            opacity: 0.55,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: ".thread",
          style: {
            "background-color": "#2dd4bf",
            "line-color": "#7c5cfc",
            "target-arrow-color": "#7c5cfc",
            width: 4,
            opacity: 1,
          },
        },
        { selector: ".story-fade", style: { opacity: 0.1 } },
        {
          selector: "node.story-active",
          style: { "background-color": "#2dd4bf", width: 38, height: 38, opacity: 1 },
        },
        {
          selector: "edge.story-edge",
          style: { "line-color": "#2dd4bf", "target-arrow-color": "#2dd4bf", width: 5, opacity: 1 },
        },
      ],
      layout: {
        name: layout,
        animate: true,
        animationDuration: 300,
        padding: 50,
      },
    });
    graph.on("tap", "node", (event) =>
      setSelected(data.nodes.find((node) => node.id === event.target.id())),
    );
    graph.on("dbltap", "node", (event) =>
      graph.animate({
        fit: { eles: event.target.closedNeighborhood(), padding: 90 },
        duration: 300,
      }),
    );
    cy.current = graph;
    return () => graph.destroy();
  }, [data, layout]);
  useEffect(() => {
    const graph = cy.current;
    if (!graph || !query) return;
    const matches = graph
      .nodes()
      .filter((node) =>
        String(node.data("label")).toLowerCase().includes(query.toLowerCase()),
      );
    graph.elements().removeClass("thread");
    matches.addClass("thread");
    matches.connectedEdges().addClass("thread");
    if (matches.length)
      graph.animate({
        fit: { eles: matches.union(matches.connectedEdges()), padding: 80 },
        duration: 300,
      });
  }, [query]);
  useEffect(() => { setStoryIndex(0); setPlaying(false); }, [story]);
  useEffect(() => {
    if (!playing || storyIndex >= story.length - 1) { if (storyIndex >= story.length - 1) setPlaying(false); return; }
    const timer = window.setTimeout(() => setStoryIndex((value) => value + 1), 1800);
    return () => window.clearTimeout(timer);
  }, [playing, storyIndex, story.length]);
  useEffect(() => {
    const graph = cy.current; const step = story[storyIndex];
    if (!graph || !step) return;
    graph.elements().removeClass("story-active story-edge story-fade");
    graph.elements().addClass("story-fade");
    const ids = story.slice(0, storyIndex + 1).map((item) => item.node.id);
    const active = graph.nodes().filter((node) => ids.includes(node.id()));
    active.removeClass("story-fade").addClass("story-active");
    const edges = active.connectedEdges().filter((edge) => ids.includes(edge.source().id()) && ids.includes(edge.target().id()));
    edges.removeClass("story-fade").addClass("story-edge");
    graph.animate({ fit: { eles: active.union(edges), padding: 110 }, duration: 500 });
  }, [story, storyIndex]);
  const reveal = () => {
    const graph = cy.current;
    if (!graph || !selected) return;
    setThreading(true);
    graph.elements().removeClass("thread");
    let node = graph.$id(selected.id);
    for (let index = 0; index < 6 && node.length; index += 1) {
      node.addClass("thread");
      const edge = node.outgoers("edge").first() as EdgeSingular;
      if (!edge.length) break;
      edge.addClass("thread");
      node = edge.target() as unknown as typeof node;
    }
    window.setTimeout(() => setThreading(false), 1700);
  };
  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Interactive software map</p>
          <h1 className="page-title mt-2">Architecture graph</h1>
          <p className="muted mt-2">
            Explore relationships and reveal execution paths through Ariadne’s
            thread.
          </p>
        </div>
        <button
          onClick={reveal}
          disabled={!selected || threading}
          className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Route className="mr-2 inline size-4" />
          {threading ? "Tracing…" : "Reveal Ariadne Thread"}
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3">
          <Search className="size-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a symbol"
            className="w-44 bg-transparent py-2 text-sm outline-none"
          />
        </label>
        <select
          value={layout}
          onChange={(event) =>
            setLayout(
              event.target.value as "cose" | "breadthfirst" | "concentric",
            )
          }
          className="rounded-xl border border-white/10 bg-slate-950 px-3 text-sm"
        >
          <option value="cose">Force layout</option>
          <option value="breadthfirst">Hierarchy</option>
          <option value="concentric">Radial</option>
        </select>
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[.07] via-slate-900/60 to-violet-400/[.08] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Architecture story mode</p>
            {story.length ? (
              <>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">{storyIndex === 0 ? `The story begins at ${story[0].node.label}.` : `${story[storyIndex - 1].node.label} ${story[storyIndex].edge?.kind ?? "connects to"} ${story[storyIndex].node.label}.`}</h2>
                <p className="mt-1 text-sm text-slate-400">Step {storyIndex + 1} of {story.length} · verified architecture evidence</p>
              </>
            ) : <p className="mt-1 text-sm text-slate-500">Analyze this repository to create a narrated architecture path.</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setStoryIndex(0); setPlaying(false); }} disabled={!story.length} className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:opacity-40" aria-label="Replay story"><RotateCcw className="size-4" /></button>
            <button onClick={() => setStoryIndex((value) => Math.max(0, value - 1))} disabled={!story.length || storyIndex === 0} className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:opacity-40" aria-label="Previous step"><SkipBack className="size-4" /></button>
            <button onClick={() => setPlaying((value) => !value)} disabled={story.length < 2} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">{playing ? <><Pause className="mr-1 inline size-4" />Pause</> : <><Play className="mr-1 inline size-4" />Play</>}</button>
            <button onClick={() => setStoryIndex((value) => Math.min(story.length - 1, value + 1))} disabled={!story.length || storyIndex === story.length - 1} className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:opacity-40" aria-label="Next step"><SkipForward className="size-4" /></button>
          </div>
        </div>
        <div className="mt-4 flex gap-1">{story.map((item, index) => <button key={item.node.id} onClick={() => setStoryIndex(index)} className={`h-1.5 flex-1 rounded-full transition ${index <= storyIndex ? "bg-cyan-300 shadow-[0_0_10px_rgba(45,212,191,.7)]" : "bg-slate-700"}`} aria-label={`Story step ${index + 1}: ${item.node.label}`} />)}</div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="ariadne-panel relative overflow-hidden">
          <div
            ref={host}
            className="h-[68vh] min-h-[520px]"
            aria-label="Interactive architecture graph"
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={() => cy.current?.zoom(cy.current.zoom() * 1.2)}
              aria-label="Zoom in"
              className="rounded-lg bg-slate-950/90 p-2"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              onClick={() => cy.current?.zoom(cy.current.zoom() / 1.2)}
              aria-label="Zoom out"
              className="rounded-lg bg-slate-950/90 p-2"
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              onClick={() => cy.current?.fit(undefined, 60)}
              aria-label="Reset graph layout"
              className="rounded-lg bg-slate-950/90 p-2"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              onClick={() => host.current?.requestFullscreen()}
              aria-label="Fullscreen graph"
              className="rounded-lg bg-slate-950/90 p-2"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        </section>
        <aside className="ariadne-panel p-5">
          {selected ? (
            <>
              <p className="eyebrow">Node context</p>
              <h2 className="mt-3 text-xl font-semibold">{selected.label}</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Type</dt>
                  <dd>{selected.kind}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Layer</dt>
                  <dd className="capitalize text-cyan-200">{selected.layer}</dd>
                </div>
              </dl>
              <p className="mt-6 text-xs leading-5 text-slate-500">
                Double-click to focus its neighborhood, or reveal Ariadne Thread
                to follow outgoing dependencies.
              </p>
            </>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Focus className="mx-auto size-6 text-violet-300" />
                <p className="mt-3 font-medium">Select a node</p>
                <p className="mt-2 text-sm text-slate-500">
                  Inspect graph context and dependencies.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
