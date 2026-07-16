import { RepositoryGraphIndexes } from "../indexes/repository-graph-indexes";

export interface DependencyTraversalOptions {
  readonly maxDepth?: number;
}

export interface DependencyTraversalResult {
  readonly startNodeId: string;
  readonly nodeIds: readonly string[];
  readonly depthByNodeId: ReadonlyMap<string, number>;
}

export class DependencyTraversal {
  public constructor(private readonly indexes: RepositoryGraphIndexes) {}

  public dependenciesOf(nodeId: string): readonly string[] {
    return this.indexes.dependencies.dependenciesOf(nodeId);
  }

  public dependentsOf(nodeId: string): readonly string[] {
    return this.indexes.dependencies.dependentsOf(nodeId);
  }

  public dependencies(nodeId: string, options: DependencyTraversalOptions = {}): DependencyTraversalResult {
    return this.walk(nodeId, options, (current) => this.indexes.dependencies.dependenciesOf(current));
  }

  public reverseDependencies(nodeId: string, options: DependencyTraversalOptions = {}): DependencyTraversalResult {
    return this.walk(nodeId, options, (current) => this.indexes.dependencies.dependentsOf(current));
  }

  private walk(startNodeId: string, options: DependencyTraversalOptions, next: (nodeId: string) => readonly string[]): DependencyTraversalResult {
    if (this.indexes.nodes.get(startNodeId) === undefined) throw new Error(`Dependency traversal start node '${startNodeId}' does not exist.`);
    const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
    if (maxDepth < 0) throw new Error("Dependency traversal max depth cannot be negative.");
    const pending: Array<{ readonly nodeId: string; readonly depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    const visited = new Set<string>();
    const depths = new Map<string, number>();

    while (pending.length > 0) {
      const current = pending.shift();
      if (current === undefined || visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      depths.set(current.nodeId, current.depth);
      if (current.depth >= maxDepth) continue;
      next(current.nodeId).forEach((nextNodeId) => {
        if (!visited.has(nextNodeId)) pending.push({ nodeId: nextNodeId, depth: current.depth + 1 });
      });
    }

    return { startNodeId, nodeIds: Object.freeze([...visited]), depthByNodeId: depths };
  }
}
