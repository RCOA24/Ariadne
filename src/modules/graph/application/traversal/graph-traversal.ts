import type { EdgeKindValue } from "../../domain/types/graph-types";
import { RepositoryGraphIndexes } from "../indexes/repository-graph-indexes";

export type TraversalDirection = "outgoing" | "incoming";

export interface TraversalOptions {
  readonly direction?: TraversalDirection;
  readonly edgeKinds?: readonly EdgeKindValue[];
  readonly maxDepth?: number;
}

export interface TraversalResult {
  readonly startNodeId: string;
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly depthByNodeId: ReadonlyMap<string, number>;
}

interface TraversalState {
  readonly nodeId: string;
  readonly depth: number;
}

export class GraphTraversal {
  public constructor(private readonly indexes: RepositoryGraphIndexes) {}

  public breadthFirst(startNodeId: string, options: TraversalOptions = {}): TraversalResult {
    return this.traverse(startNodeId, options, "breadth-first");
  }

  public depthFirst(startNodeId: string, options: TraversalOptions = {}): TraversalResult {
    return this.traverse(startNodeId, options, "depth-first");
  }

  private traverse(startNodeId: string, options: TraversalOptions, strategy: "breadth-first" | "depth-first"): TraversalResult {
    if (this.indexes.nodes.get(startNodeId) === undefined) throw new Error(`Traversal start node '${startNodeId}' does not exist.`);
    const direction = options.direction ?? "outgoing";
    const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
    if (maxDepth < 0) throw new Error("Traversal max depth cannot be negative.");

    const pending: TraversalState[] = [{ nodeId: startNodeId, depth: 0 }];
    const visited = new Set<string>();
    const edgeIds = new Set<string>();
    const depthByNodeId = new Map<string, number>();

    while (pending.length > 0) {
      const current = strategy === "breadth-first" ? pending.shift() : pending.pop();
      if (current === undefined || visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      depthByNodeId.set(current.nodeId, current.depth);
      if (current.depth >= maxDepth) continue;

      const edges = direction === "outgoing" ? this.indexes.edges.from(current.nodeId) : this.indexes.reverseEdges.to(current.nodeId);
      const applicable = options.edgeKinds === undefined ? edges : edges.filter((edge) => options.edgeKinds?.includes(edge.kind.value));
      applicable.forEach((edge) => {
        edgeIds.add(edge.id.value);
        const nextNodeId = direction === "outgoing" ? edge.targetNodeId.value : edge.sourceNodeId.value;
        if (!visited.has(nextNodeId)) pending.push({ nodeId: nextNodeId, depth: current.depth + 1 });
      });
    }

    return {
      startNodeId,
      nodeIds: Object.freeze([...visited]),
      edgeIds: Object.freeze([...edgeIds]),
      depthByNodeId
    };
  }
}
