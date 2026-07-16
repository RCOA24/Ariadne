"use client";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useRef, useState } from "react";
type Graph = {
  nodes: { id: string; label: string; kind: string; layer: string }[];
  edges: { id: string; source: string; target: string; kind: string }[];
  nextCursor?: string;
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
  const graph = useRef<Core | null>(null);
  const [data, setData] = useState<Graph>();
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/architecture`)
      .then((r) => r.json())
      .then(setData);
  }, [repositoryId]);
  useEffect(() => {
    if (!host.current || !data) return;
    const elements: ElementDefinition[] = [
      ...data.nodes.map((node) => ({
        data: { id: node.id, label: node.label, layer: node.layer },
        classes: node.kind,
      })),
      ...data.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.kind,
        },
      })),
    ];
    graph.current?.destroy();
    graph.current = cytoscape({
      container: host.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": (node) =>
              colors[node.data("layer")] ?? colors.unknown,
            color: "#e2e8f0",
            "font-size": 10,
            "text-valign": "bottom",
            "text-margin-y": 6,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 8,
            color: "#94a3b8",
          },
        },
        {
          selector: ".highlight",
          style: { "background-color": "#f43f5e", width: 3 },
        },
      ],
      layout: { name: "cose", animate: false },
    });
    return () => graph.current?.destroy();
  }, [data]);
  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;
    cy.elements().removeClass("highlight");
    if (search.trim()) {
      const found = cy
        .nodes()
        .filter((node) =>
          String(node.data("label"))
            .toLowerCase()
            .includes(search.toLowerCase()),
        );
      found.addClass("highlight");
      found.connectedEdges().addClass("highlight");
      cy.animate({
        fit: { eles: found.union(found.connectedEdges()), padding: 60 },
        duration: 250,
      });
    }
  }, [search]);
  return (
    <main className="mx-auto max-w-7xl p-8">
      <h1 className="text-3xl font-semibold text-white">
        Architecture Visualization
      </h1>
      <p className="mt-2 text-slate-400">
        System overview, dependency direction, and detected layer placement.
      </p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search nodes and highlight dependencies"
        className="mt-6 w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />
      <div className="mt-4 flex gap-4 text-xs">
        {Object.entries(colors).map(([name, color]) => (
          <span key={name} style={{ color }}>
            {name}
          </span>
        ))}
      </div>
      <div
        ref={host}
        className="mt-5 h-[70vh] rounded-xl border border-slate-800 bg-slate-950"
      />
    </main>
  );
}
