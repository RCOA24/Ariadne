import type { GraphEdge } from "../entities/graph-edge";
import type { GraphNode } from "../entities/graph-node";
import { UniqueEdgeIdsSpecification, UniqueNodeIdsSpecification, type GraphValidationFailure } from "../specifications/graph-specifications";

export class DuplicateNodeDetector {
  public detect(nodes: readonly GraphNode[]): readonly GraphValidationFailure[] {
    return new UniqueNodeIdsSpecification().validate(nodes);
  }
}

export class DuplicateEdgeDetector {
  public detect(edges: readonly GraphEdge[]): readonly GraphValidationFailure[] {
    return new UniqueEdgeIdsSpecification().validate(edges);
  }
}
