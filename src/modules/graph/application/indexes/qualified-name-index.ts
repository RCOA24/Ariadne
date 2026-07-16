import type { GraphNode } from "../../domain/entities/graph-node";

export class QualifiedNameIndex {
  private readonly byQualifiedName: ReadonlyMap<string, readonly GraphNode[]>;
  private readonly bySimpleName: ReadonlyMap<string, readonly GraphNode[]>;

  public constructor(nodes: readonly GraphNode[]) {
    this.byQualifiedName = this.group(nodes, (node) => node.qualifiedName);
    this.bySimpleName = this.group(nodes, (node) => node.name);
  }

  public find(qualifiedName: string): readonly GraphNode[] {
    return this.byQualifiedName.get(qualifiedName) ?? [];
  }

  public findBySimpleName(name: string): readonly GraphNode[] {
    return this.bySimpleName.get(name) ?? [];
  }

  private group(nodes: readonly GraphNode[], keyOf: (node: GraphNode) => string): ReadonlyMap<string, readonly GraphNode[]> {
    const grouped = new Map<string, GraphNode[]>();
    nodes.forEach((node) => {
      const key = keyOf(node);
      grouped.set(key, [...(grouped.get(key) ?? []), node]);
    });
    return new Map([...grouped.entries()].map(([key, values]) => [key, Object.freeze(values.sort((left, right) => left.id.value.localeCompare(right.id.value)))]));
  }
}
