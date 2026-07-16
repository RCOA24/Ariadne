import type { GraphEdge } from "../../domain/entities/graph-edge";

export class ReverseEdgeIndex {
  private readonly byTarget: ReadonlyMap<string, readonly GraphEdge[]>;

  public constructor(edges: readonly GraphEdge[]) {
    const grouped = new Map<string, GraphEdge[]>();
    edges.forEach((edge) => grouped.set(edge.targetNodeId.value, [...(grouped.get(edge.targetNodeId.value) ?? []), edge]));
    this.byTarget = new Map([...grouped.entries()].map(([key, value]) => [key, Object.freeze(value.sort((left, right) => left.id.value.localeCompare(right.id.value)))]));
  }

  public to(nodeId: string): readonly GraphEdge[] {
    return this.byTarget.get(nodeId) ?? [];
  }
}
