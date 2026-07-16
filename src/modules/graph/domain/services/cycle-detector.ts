import type { GraphEdge } from "../entities/graph-edge";
import type { GraphNode } from "../entities/graph-node";

export interface GraphCycle {
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
}

interface TraversalStep {
  readonly nodeId: string;
  readonly incomingEdgeId?: string;
}

export class CycleDetector {
  public detect(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): readonly GraphCycle[] {
    const edgesBySource = new Map<string, GraphEdge[]>();
    edges.forEach((edge) => edgesBySource.set(edge.sourceNodeId.value, [...(edgesBySource.get(edge.sourceNodeId.value) ?? []), edge]));
    edgesBySource.forEach((sourceEdges) => sourceEdges.sort((left, right) => left.id.value.localeCompare(right.id.value)));

    const visited = new Set<string>();
    const active = new Set<string>();
    const stack: TraversalStep[] = [];
    const cycles = new Map<string, GraphCycle>();

    const visit = (nodeId: string, incomingEdgeId?: string): void => {
      visited.add(nodeId);
      active.add(nodeId);
      stack.push({ nodeId, incomingEdgeId });
      (edgesBySource.get(nodeId) ?? []).forEach((edge) => {
        const target = edge.targetNodeId.value;
        if (active.has(target)) {
          const cycleStart = stack.findIndex((step) => step.nodeId === target);
          const cycleSteps = [...stack.slice(cycleStart), { nodeId: target, incomingEdgeId: edge.id.value }];
          const cycle = this.normalize(cycleSteps);
          cycles.set(cycle.nodeIds.join("|"), cycle);
        } else if (!visited.has(target)) {
          visit(target, edge.id.value);
        }
      });
      stack.pop();
      active.delete(nodeId);
    };

    nodes.slice().sort((left, right) => left.id.value.localeCompare(right.id.value)).forEach((node) => {
      if (!visited.has(node.id.value)) visit(node.id.value);
    });
    return Object.freeze([...cycles.values()].sort((left, right) => left.nodeIds.join("|").localeCompare(right.nodeIds.join("|"))));
  }

  private normalize(steps: readonly TraversalStep[]): GraphCycle {
    const rawNodeIds = steps.slice(0, -1).map((step) => step.nodeId);
    const rotateAt = rawNodeIds.reduce((best, nodeId, index) => nodeId < rawNodeIds[best]! ? index : best, 0);
    const nodeIds = [...rawNodeIds.slice(rotateAt), ...rawNodeIds.slice(0, rotateAt)];
    const edgeIds = steps.slice(1).map((step) => step.incomingEdgeId).filter((edgeId): edgeId is string => edgeId !== undefined);
    return { nodeIds: Object.freeze(nodeIds), edgeIds: Object.freeze(edgeIds.sort()) };
  }
}
