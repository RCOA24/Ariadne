import type { GraphEdge } from "../../domain/entities/graph-edge";
import type { GraphNode } from "../../domain/entities/graph-node";
import type { GraphId } from "../../domain/value-objects/identifiers";

export type GraphBuildStatus = "created" | "indexing" | "building-nodes" | "building-edges" | "completed" | "failed";

export interface GraphBuildSessionProperties {
  readonly id: string;
  readonly graphId: GraphId;
  readonly status: GraphBuildStatus;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly failureMessage?: string;
}

export class GraphBuildSession {
  public constructor(public readonly properties: GraphBuildSessionProperties) {
    this.properties = Object.freeze({
      ...properties,
      nodes: Object.freeze([...properties.nodes]),
      edges: Object.freeze([...properties.edges])
    });
    Object.freeze(this);
  }

  public with(properties: Partial<GraphBuildSessionProperties>): GraphBuildSession {
    return new GraphBuildSession({ ...this.properties, ...properties });
  }
}
