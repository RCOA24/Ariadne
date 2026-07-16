import type { GraphEdge } from "../../domain/entities/graph-edge";
import type { EdgeKindValue } from "../../domain/types/graph-types";

export class EdgeIndex {
  private readonly byId: ReadonlyMap<string, GraphEdge>;
  private readonly bySource: ReadonlyMap<string, readonly GraphEdge[]>;
  private readonly byKind: ReadonlyMap<EdgeKindValue, readonly GraphEdge[]>;

  public constructor(edges: readonly GraphEdge[]) {
    this.byId = new Map(edges.map((edge) => [edge.id.value, edge]));
    this.bySource = this.group(edges, (edge) => edge.sourceNodeId.value);
    this.byKind = this.group(edges, (edge) => edge.kind.value);
  }

  public get(edgeId: string): GraphEdge | undefined {
    return this.byId.get(edgeId);
  }

  public from(nodeId: string): readonly GraphEdge[] {
    return this.bySource.get(nodeId) ?? [];
  }

  public ofKind(kind: EdgeKindValue): readonly GraphEdge[] {
    return this.byKind.get(kind) ?? [];
  }

  private group<Key extends string>(edges: readonly GraphEdge[], keyOf: (edge: GraphEdge) => Key): ReadonlyMap<Key, readonly GraphEdge[]> {
    const grouped = new Map<Key, GraphEdge[]>();
    edges.forEach((edge) => {
      const key = keyOf(edge);
      grouped.set(key, [...(grouped.get(key) ?? []), edge]);
    });
    return new Map([...grouped.entries()].map(([key, value]) => [key, Object.freeze(value.sort((left, right) => left.id.value.localeCompare(right.id.value)))]));
  }
}
