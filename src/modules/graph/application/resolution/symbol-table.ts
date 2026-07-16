import type { GraphNode } from "../../domain/entities/graph-node";

export class SymbolTable {
  private constructor(
    private readonly byQualifiedName: ReadonlyMap<string, readonly GraphNode[]>,
    private readonly byName: ReadonlyMap<string, readonly GraphNode[]>
  ) {}

  public static from(nodes: readonly GraphNode[]): SymbolTable {
    const qualified = new Map<string, GraphNode[]>();
    const names = new Map<string, GraphNode[]>();
    nodes.filter((node) => SymbolTable.isSymbol(node)).forEach((node) => {
      qualified.set(node.qualifiedName, [...(qualified.get(node.qualifiedName) ?? []), node]);
      names.set(node.name, [...(names.get(node.name) ?? []), node]);
    });
    return new SymbolTable(SymbolTable.freeze(qualified), SymbolTable.freeze(names));
  }

  public findByName(name: string): readonly GraphNode[] {
    return this.byName.get(name) ?? [];
  }

  public findByQualifiedName(name: string): readonly GraphNode[] {
    return this.byQualifiedName.get(name) ?? [];
  }

  private static isSymbol(node: GraphNode): boolean {
    return !["repository", "workspace", "solution", "project", "package", "folder", "file", "import", "export", "external-dependency", "configuration", "unknown"].includes(node.kind.value);
  }

  private static freeze(source: ReadonlyMap<string, GraphNode[]>): ReadonlyMap<string, readonly GraphNode[]> {
    return new Map([...source.entries()].map(([key, nodes]) => [key, Object.freeze(nodes.sort((left, right) => left.id.value.localeCompare(right.id.value)))]));
  }
}
