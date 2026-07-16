import type { EdgeConfidence, GraphMetadataValue } from "../types/graph-types";
import type { EdgeKind } from "../value-objects/edge-kind";
import type { EdgeId, NodeId } from "../value-objects/identifiers";
import type { NodeLocation } from "../value-objects/node-location";

export interface GraphEdgeProperties {
  readonly id: EdgeId;
  readonly sourceNodeId: NodeId;
  readonly targetNodeId: NodeId;
  readonly kind: EdgeKind;
  readonly confidence: EdgeConfidence;
  readonly evidence: readonly NodeLocation[];
  readonly metadata?: Readonly<Record<string, GraphMetadataValue>>;
}

export class GraphEdge {
  public readonly id: EdgeId;
  public readonly sourceNodeId: NodeId;
  public readonly targetNodeId: NodeId;
  public readonly kind: EdgeKind;
  public readonly confidence: EdgeConfidence;
  public readonly evidence: readonly NodeLocation[];
  public readonly metadata: Readonly<Record<string, GraphMetadataValue>>;

  public constructor(properties: GraphEdgeProperties) {
    if (properties.sourceNodeId.value === properties.targetNodeId.value && properties.kind.value === "owns") {
      throw new Error("A node cannot own itself.");
    }
    this.id = properties.id;
    this.sourceNodeId = properties.sourceNodeId;
    this.targetNodeId = properties.targetNodeId;
    this.kind = properties.kind;
    this.confidence = properties.confidence;
    this.evidence = Object.freeze([...properties.evidence]);
    this.metadata = Object.freeze({ ...(properties.metadata ?? {}) });
    Object.freeze(this);
  }
}
