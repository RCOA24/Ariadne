import type { GraphNode } from "../../domain/entities/graph-node";

export class SymbolIndex {
  private constructor(
    private readonly byQualifiedName: ReadonlyMap<string, GraphNode>,
    private readonly byName: ReadonlyMap<string, readonly GraphNode[]>
  ) {}

  public static from(nodes: readonly GraphNode[]): SymbolIndex {
    const qualified = new Map<string, GraphNode>();
    const names = new Map<string, GraphNode[]>();
    nodes.forEach((node) => {
      if (node.kind.value === "file" || node.kind.value === "folder" || node.kind.value === "repository") return;
      qualified.set(node.qualifiedName, node);
      names.set(node.name, [...(names.get(node.name) ?? []), node]);
    });
    return new SymbolIndex(qualified, new Map([...names.entries()].map(([name, value]) => [name, Object.freeze(value)])));
  }

  public findByQualifiedName(name: string): GraphNode | undefined {
    return this.byQualifiedName.get(name);
  }

  public findByName(name: string): readonly GraphNode[] {
    return this.byName.get(name) ?? [];
  }
}
