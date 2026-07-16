import type { GraphEdge } from "../entities/graph-edge";
import type { GraphNode } from "../entities/graph-node";
import type { EdgeKindValue, NodeKindValue } from "../types/graph-types";
import { GraphStatistics } from "../value-objects/graph-statistics";

export class GraphStatisticsCalculator {
  public calculate(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): GraphStatistics {
    const nodeCountsByKind: Partial<Record<NodeKindValue, number>> = {};
    const edgeCountsByKind: Partial<Record<EdgeKindValue, number>> = {};
    nodes.forEach((node) => { nodeCountsByKind[node.kind.value] = (nodeCountsByKind[node.kind.value] ?? 0) + 1; });
    edges.forEach((edge) => { edgeCountsByKind[edge.kind.value] = (edgeCountsByKind[edge.kind.value] ?? 0) + 1; });
    return new GraphStatistics({ nodeCount: nodes.length, edgeCount: edges.length, nodeCountsByKind, edgeCountsByKind });
  }
}
