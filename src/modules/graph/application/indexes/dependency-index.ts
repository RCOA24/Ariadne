import type { GraphEdge } from "../../domain/entities/graph-edge";

const dependencyKinds = new Set(["imports", "depends-on", "uses", "references"]);

export class DependencyIndex {
  private readonly dependenciesByNode: ReadonlyMap<string, readonly string[]>;
  private readonly dependentsByNode: ReadonlyMap<string, readonly string[]>;

  public constructor(edges: readonly GraphEdge[]) {
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();
    edges.filter((edge) => dependencyKinds.has(edge.kind.value)).forEach((edge) => {
      dependencies.set(edge.sourceNodeId.value, [...(dependencies.get(edge.sourceNodeId.value) ?? []), edge.targetNodeId.value]);
      dependents.set(edge.targetNodeId.value, [...(dependents.get(edge.targetNodeId.value) ?? []), edge.sourceNodeId.value]);
    });
    this.dependenciesByNode = DependencyIndex.freeze(dependencies);
    this.dependentsByNode = DependencyIndex.freeze(dependents);
  }

  public dependenciesOf(nodeId: string): readonly string[] {
    return this.dependenciesByNode.get(nodeId) ?? [];
  }

  public dependentsOf(nodeId: string): readonly string[] {
    return this.dependentsByNode.get(nodeId) ?? [];
  }

  private static freeze(source: ReadonlyMap<string, string[]>): ReadonlyMap<string, readonly string[]> {
    return new Map([...source.entries()].map(([key, values]) => [key, Object.freeze([...new Set(values)].sort())]));
  }
}
