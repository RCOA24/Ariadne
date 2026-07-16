import type { GraphNode } from "../../domain/entities/graph-node";
import { QualifiedNameResolver } from "./qualified-name-resolver";

export class NamespaceResolver {
  private readonly namespaces: ReadonlyMap<string, readonly GraphNode[]>;

  public constructor(nodes: readonly GraphNode[], private readonly qualifiedNames: QualifiedNameResolver) {
    const entries = new Map<string, GraphNode[]>();
    nodes.filter((node) => node.kind.value === "namespace").forEach((node) => entries.set(node.name, [...(entries.get(node.name) ?? []), node]));
    this.namespaces = new Map([...entries.entries()].map(([name, values]) => [name, Object.freeze(values)]));
  }

  public resolveNamespace(name: string): readonly GraphNode[] {
    return this.namespaces.get(name) ?? [];
  }

  public resolveSymbol(reference: string, preferredFilePath?: string): readonly GraphNode[] {
    return this.qualifiedNames.resolve(reference, preferredFilePath);
  }
}
