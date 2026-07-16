"use client";
import cytoscape, { type Core, type EdgeSingular } from "cytoscape";
import {
  Focus,
  Maximize2,
  RotateCcw,
  Route,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
