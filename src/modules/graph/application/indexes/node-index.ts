import type { GraphNode } from "../../domain/entities/graph-node";
import type { NodeKindValue } from "../../domain/types/graph-types";

export class NodeIndex {
  private readonly byId: ReadonlyMap<string, GraphNode>;
  private readonly byKind: ReadonlyMap<NodeKindValue, readonly GraphNode[]>;

  public constructor(nodes: readonly GraphNode[]) {
    this.byId = new Map(nodes.map((node) => [node.id.value, node]));
    const grouped = new Map<NodeKindValue, GraphNode[]>();
    nodes.forEach((node) => grouped.set(node.kind.value, [...(grouped.get(node.kind.value) ?? []), node]));
    this.byKind = new Map([...grouped.entries()].map(([kind, value]) => [kind, Object.freeze(value.sort((left, right) => left.id.value.localeCompare(right.id.value)))]));
  }

  public get(nodeId: string): GraphNode | undefined {
    return this.byId.get(nodeId);
  }

  public getByKind(kind: NodeKindValue): readonly GraphNode[] {
    return this.byKind.get(kind) ?? [];
  }

  public get size(): number {
    return this.byId.size;
  }
}
