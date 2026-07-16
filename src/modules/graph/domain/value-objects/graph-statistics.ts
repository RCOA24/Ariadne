import type { EdgeKindValue, NodeKindValue } from "../types/graph-types";

export interface GraphStatisticsProperties {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodeCountsByKind: Readonly<Partial<Record<NodeKindValue, number>>>;
  readonly edgeCountsByKind: Readonly<Partial<Record<EdgeKindValue, number>>>;
}

export class GraphStatistics {
  public readonly nodeCount: number;
  public readonly edgeCount: number;
  public readonly nodeCountsByKind: Readonly<Partial<Record<NodeKindValue, number>>>;
  public readonly edgeCountsByKind: Readonly<Partial<Record<EdgeKindValue, number>>>;

  public constructor(properties: GraphStatisticsProperties) {
    if (properties.nodeCount < 0 || properties.edgeCount < 0) throw new Error("Graph statistics cannot contain negative counts.");
    this.nodeCount = properties.nodeCount;
    this.edgeCount = properties.edgeCount;
    this.nodeCountsByKind = Object.freeze({ ...properties.nodeCountsByKind });
    this.edgeCountsByKind = Object.freeze({ ...properties.edgeCountsByKind });
    Object.freeze(this);
  }
}
