import { RepositoryGraphIndexes } from "../indexes/repository-graph-indexes";

export interface OwnershipTraversalResult {
  readonly startNodeId: string;
  readonly nodeIds: readonly string[];
  readonly depthByNodeId: ReadonlyMap<string, number>;
}

export class OwnershipTraversal {
  public constructor(private readonly indexes: RepositoryGraphIndexes) {}

  public ancestorsOf(nodeId: string): readonly string[] {
    this.ensureNode(nodeId);
    const ancestors: string[] = [];
    let current = this.indexes.ownership.ownerOf(nodeId);
    while (current !== undefined) {
      ancestors.push(current);
      current = this.indexes.ownership.ownerOf(current);
    }
    return Object.freeze(ancestors);
  }

  public descendantsOf(nodeId: string, maxDepth = Number.POSITIVE_INFINITY): OwnershipTraversalResult {
    this.ensureNode(nodeId);
    if (maxDepth < 0) throw new Error("Ownership traversal max depth cannot be negative.");
    const pending: Array<{ readonly nodeId: string; readonly depth: number }> = [{ nodeId, depth: 0 }];
    const visited = new Set<string>();
    const depths = new Map<string, number>();
    while (pending.length > 0) {
      const current = pending.shift();
      if (current === undefined || visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      depths.set(current.nodeId, current.depth);
      if (current.depth >= maxDepth) continue;
      this.indexes.ownership.childrenOf(current.nodeId).forEach((child) => pending.push({ nodeId: child, depth: current.depth + 1 }));
    }
    return { startNodeId: nodeId, nodeIds: Object.freeze([...visited]), depthByNodeId: depths };
  }

  private ensureNode(nodeId: string): void {
    if (this.indexes.nodes.get(nodeId) === undefined) throw new Error(`Ownership traversal start node '${nodeId}' does not exist.`);
  }
}
