import { RepositoryGraph } from "../aggregates/repository-graph";
import { GraphSnapshot } from "../aggregates/graph-snapshot";
import { GraphEdge, type GraphEdgeProperties } from "../entities/graph-edge";
import { GraphNode, type GraphNodeProperties } from "../entities/graph-node";
import type { EdgeKindValue, NodeKindValue } from "../types/graph-types";
import { EdgeKind } from "../value-objects/edge-kind";
import { EdgeId, GraphId, NodeId, SnapshotId } from "../value-objects/identifiers";
import type { GraphMetadata } from "../value-objects/graph-metadata";
import { GraphStatisticsCalculator } from "../services/graph-statistics-calculator";
import { GraphVersion } from "../value-objects/graph-version";
import { NodeKind } from "../value-objects/node-kind";
import { RepositoryGraphValidator } from "../specifications/graph-specifications";

export class RepositoryNodeFactory {
  public create(properties: Omit<GraphNodeProperties, "id" | "kind">): GraphNode {
    return new GraphNode({
      ...properties,
      id: NodeId.fromStableIdentity(properties.graphId, properties.stableIdentity),
      kind: new NodeKind("repository")
    });
  }
}

export class RepositoryEdgeFactory {
  public create(properties: Omit<GraphEdgeProperties, "id" | "kind"> & { readonly graphId: GraphId; readonly stableIdentity: string; readonly kind: EdgeKindValue }): GraphEdge {
    return new GraphEdge({
      ...properties,
      id: EdgeId.fromStableIdentity(properties.graphId, properties.stableIdentity),
      kind: new EdgeKind(properties.kind)
    });
  }
}

export class GraphSnapshotFactory {
  public create(input: { readonly graphId: GraphId; readonly sourceSnapshotIdentity: string; readonly version: GraphVersion; readonly createdAt: Date }): GraphSnapshot {
    return new GraphSnapshot({
      id: new SnapshotId(`${input.graphId.value}:snapshot:${encodeURIComponent(input.sourceSnapshotIdentity)}`),
      graphId: input.graphId,
      sourceSnapshotIdentity: input.sourceSnapshotIdentity,
      version: input.version,
      createdAt: input.createdAt
    });
  }
}

export class RepositoryGraphFactory {
  public createBuilding(input: {
    readonly id: GraphId;
    readonly snapshot: GraphSnapshot;
    readonly metadata: GraphMetadata;
    readonly nodes: readonly GraphNode[];
    readonly edges: readonly GraphEdge[];
  }): RepositoryGraph {
    const graph = new RepositoryGraph({
      ...input,
      statistics: new GraphStatisticsCalculator().calculate(input.nodes, input.edges),
      status: "building"
    });
    const failures = new RepositoryGraphValidator().validate(graph);
    if (failures.length > 0) throw new Error(failures.map((failure) => failure.message).join(" "));
    return graph;
  }

  public createNode(input: Omit<GraphNodeProperties, "id" | "kind"> & { readonly kind: NodeKindValue }): GraphNode {
    return new GraphNode({
      ...input,
      id: NodeId.fromStableIdentity(input.graphId, input.stableIdentity),
      kind: new NodeKind(input.kind)
    });
  }
}
